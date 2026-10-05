import * as React from 'react'
import { render } from '@react-email/render'
import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { verifyStandardWebhook, WebhookVerificationError } from '@/lib/email/provider.server'
import { SignupEmail } from '@/lib/email-templates/signup'
import { InviteEmail } from '@/lib/email-templates/invite'
import { MagicLinkEmail } from '@/lib/email-templates/magic-link'
import { RecoveryEmail } from '@/lib/email-templates/recovery'
import { EmailChangeEmail } from '@/lib/email-templates/email-change'
import { ReauthenticationEmail } from '@/lib/email-templates/reauthentication'

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email',
  invite: "You've been invited",
  magiclink: 'Arjun IFVG - Login OTP',
  recovery: 'Reset your password',
  email_change: 'Confirm your new email',
  reauthentication: 'Your verification code',
}

// Template mapping
const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

// Configuration
const SITE_NAME = "Blueprint"
const FROM_NAME = "Arjun IFVG - Login"
const FROM_LOCAL = "auth"
const SENDER_DOMAIN = "notify.blueprint.ifvg.in"
const ROOT_DOMAIN = "blueprint.ifvg.in"
const FROM_DOMAIN = "blueprint.ifvg.in"

function redactEmail(email: string | null | undefined): string {
  if (!email) return '***'
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return '***'
  return `${localPart[0]}***@${domain}`
}

// Supabase "Send Email" auth hook. Configure in Supabase -> Auth -> Hooks ->
// Send Email -> HTTPS, URL https://<domain>/lovable/email/auth/webhook, and put the
// generated secret in SEND_EMAIL_HOOK_SECRET.
interface SendEmailHookPayload {
  user: { email: string; new_email?: string }
  email_data: {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: string
    site_url: string
    token_new?: string
    token_hash_new?: string
  }
}

export const Route = createFileRoute("/lovable/email/auth/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.SEND_EMAIL_HOOK_SECRET
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!secret || !supabaseUrl || !supabaseServiceKey) {
          console.error('Missing SEND_EMAIL_HOOK_SECRET / Supabase environment variables')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        let payload: SendEmailHookPayload
        try {
          payload = JSON.parse(await verifyStandardWebhook(request, secret))
        } catch (error) {
          if (error instanceof WebhookVerificationError) {
            console.error('Invalid webhook signature', { error: error.message })
            return Response.json({ error: 'Invalid signature' }, { status: 401 })
          }
          console.error('Invalid webhook payload', { error })
          return Response.json({ error: 'Invalid webhook payload' }, { status: 400 })
        }

        const emailType = payload.email_data?.email_action_type
        const EmailTemplate = EMAIL_TEMPLATES[emailType]
        if (!EmailTemplate) {
          console.error('Unknown email type', { emailType })
          return Response.json({ error: `Unknown email type: ${emailType}` }, { status: 400 })
        }

        const { email_data: d, user } = payload
        const verifyUrl = (tokenHash: string) =>
          `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}` +
          `&type=${encodeURIComponent(emailType)}&redirect_to=${encodeURIComponent(d.redirect_to ?? d.site_url ?? '')}`

        // Secure email change sends one email to each address (current + new).
        const recipients: { to: string; token: string; tokenHash: string }[] = [
          { to: user.email, token: d.token, tokenHash: d.token_hash },
        ]
        if (emailType === 'email_change' && user.new_email && d.token_hash_new) {
          recipients.push({ to: user.new_email, token: d.token_new ?? '', tokenHash: d.token_hash_new })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const run_id = crypto.randomUUID()

        for (const r of recipients) {
          const element = React.createElement(EmailTemplate, {
            siteName: SITE_NAME,
            siteUrl: `https://${ROOT_DOMAIN}`,
            recipient: r.to,
            confirmationUrl: verifyUrl(r.tokenHash),
            token: r.token,
            email: user.email,
            oldEmail: user.email,
            newEmail: user.new_email,
          })
          const html = await render(element)
          const text = await render(element, { plainText: true })
          const messageId = crypto.randomUUID()

          // Log pending BEFORE enqueue so we have a record even if enqueue crashes
          await supabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: emailType,
            recipient_email: r.to,
            status: 'pending',
          })

          const { error: enqueueError } = await supabase.rpc('enqueue_email', {
            queue_name: 'auth_emails',
            payload: {
              run_id,
              message_id: messageId,
              to: r.to,
              from: `${FROM_NAME} <${FROM_LOCAL}@${FROM_DOMAIN}>`,
              sender_domain: SENDER_DOMAIN,
              subject: EMAIL_SUBJECTS[emailType] || 'Notification',
              html,
              text,
              purpose: 'transactional',
              label: emailType,
              queued_at: new Date().toISOString(),
            },
          })

          if (enqueueError) {
            console.error('Failed to enqueue auth email', { error: enqueueError, run_id, emailType })
            await supabase.from('email_send_log').insert({
              message_id: messageId,
              template_name: emailType,
              recipient_email: r.to,
              status: 'failed',
              error_message: 'Failed to enqueue email',
            })
            return Response.json({ error: 'Failed to enqueue email' }, { status: 500 })
          }
          console.log('Auth email enqueued', { emailType, email_redacted: redactEmail(r.to), run_id })
        }

        return Response.json({ success: true, queued: true })
      },
    },
  },
})
