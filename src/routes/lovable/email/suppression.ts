import { createClient } from '@supabase/supabase-js'
import { verifyStandardWebhook, WebhookVerificationError } from '@/lib/email/provider.server'
import { createFileRoute } from '@tanstack/react-router'

// Resend webhook (Svix-signed). Add an endpoint in Resend -> Webhooks for
// email.bounced and email.complained pointing at /lovable/email/suppression and
// store its signing secret in RESEND_WEBHOOK_SECRET.
interface SuppressionPayload {
  email: string
  reason: 'bounce' | 'complaint' | 'unsubscribe'
  message_id?: string
  metadata?: Record<string, unknown>
  is_retry: boolean
  retry_count: number
}

// Returns null for events we don't act on (delivered, opened, transient bounces...).
function parseSuppressionPayload(body: string): SuppressionPayload | null {
  const evt = JSON.parse(body)
  const reason =
    evt.type === 'email.bounced' ? 'bounce' : evt.type === 'email.complained' ? 'complaint' : null
  if (!reason) return null
  // Only permanent bounces should suppress an address.
  if (reason === 'bounce' && evt.data?.bounce?.type && evt.data.bounce.type !== 'Permanent') return null
  const email = Array.isArray(evt.data?.to) ? evt.data.to[0] : null
  if (!email) throw new Error('Missing recipient')
  return {
    email,
    reason,
    message_id: evt.data?.email_id,
    metadata: { provider: 'resend', event: evt.type, bounce: evt.data?.bounce ?? null },
    is_retry: false,
    retry_count: 0,
  }
}

function mapReasonToStatus(
  reason: string,
): 'bounced' | 'complained' | 'suppressed' {
  switch (reason) {
    case 'bounce':
      return 'bounced'
    case 'complaint':
      return 'complained'
    default:
      return 'suppressed'
  }
}

function mapReasonToMessage(reason: string): string {
  switch (reason) {
    case 'bounce':
      return 'Permanent bounce — email address is invalid or rejected'
    case 'complaint':
      return 'Spam complaint — recipient marked email as spam'
    case 'unsubscribe':
      return 'Recipient unsubscribed'
    default:
      return 'Email suppressed'
  }
}

export const Route = createFileRoute("/lovable/email/suppression")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env['RESEND_WEBHOOK_SECRET']
        const supabaseUrl = import.meta.env['VITE_SUPABASE_URL']
        const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

        if (!secret || !supabaseUrl || !supabaseServiceKey) {
          console.error('Missing required environment variables')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        let payload: SuppressionPayload | null
        try {
          payload = parseSuppressionPayload(await verifyStandardWebhook(request, secret))
        } catch (error) {
          if (error instanceof WebhookVerificationError) {
            console.error('Invalid webhook signature', { code: error.message })
            return Response.json({ error: 'Invalid signature' }, { status: 401 })
          }
          console.error('Invalid payload', { error })
          return Response.json({ error: 'Invalid payload' }, { status: 400 })
        }
        if (!payload) return Response.json({ success: true, ignored: true })

        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const normalizedEmail = payload.email.toLowerCase()

        // 1. Upsert to suppressed_emails (idempotent — safe for retries)
        const { error: suppressError } = await supabase
          .from('suppressed_emails')
          .upsert(
            {
              email: normalizedEmail,
              reason: payload.reason,
              metadata: payload.metadata ?? null,
            },
            { onConflict: 'email' },
          )

        if (suppressError) {
          console.error('Failed to upsert suppressed email', {
            error: suppressError,
            email_redacted: normalizedEmail[0] + '***@' + normalizedEmail.split('@')[1],
          })
          return Response.json({ error: 'Failed to write suppression' }, { status: 500 })
        }

        // 2. Append a new log entry for the suppression event (never update existing rows)
        const sendLogStatus = mapReasonToStatus(payload.reason)
        const sendLogMessage = mapReasonToMessage(payload.reason)

        const { error: insertError } = await supabase
          .from('email_send_log')
          .insert({
            message_id: payload.message_id ?? null,
            template_name: 'system',
            recipient_email: normalizedEmail,
            status: sendLogStatus,
            error_message: sendLogMessage,
            metadata: payload.metadata ?? null,
          })

        if (insertError) {
          // Non-fatal — log and continue. The suppression was already recorded.
          console.warn('Failed to insert email_send_log', {
            error: insertError,
          })
        }

        console.log('Suppression processed', {
          email_redacted: normalizedEmail[0] + '***@' + normalizedEmail.split('@')[1],
          reason: payload.reason,
          is_retry: payload.is_retry,
          retry_count: payload.retry_count,
          has_message_id: !!payload.message_id,
        })

        return Response.json({ success: true })
      },
    },
  },
})
