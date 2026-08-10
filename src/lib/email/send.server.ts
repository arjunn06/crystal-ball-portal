import * as React from 'react'
import { render } from '@react-email/render'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'Arjun IFVG'
const SENDER_DOMAIN = 'notify.blueprint.ifvg.in'
const FROM_DOMAIN = 'notify.blueprint.ifvg.in'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Server-side transactional send (no JWT needed) — for webhooks and other
 * trusted server code. Mirrors /lovable/email/transactional/send: suppression
 * check, unsubscribe token, render, enqueue. Never throws.
 */
export async function sendTransactionalServer(input: {
  templateName: string
  recipientEmail: string
  idempotencyKey?: string
  templateData?: Record<string, unknown>
}): Promise<{ success: boolean; reason?: string }> {
  try {
    const template = TEMPLATES[input.templateName]
    if (!template) return { success: false, reason: 'template_not_found' }

    const recipient = template.to || input.recipientEmail
    if (!recipient) return { success: false, reason: 'no_recipient' }
    const normalized = recipient.toLowerCase()
    const messageId = crypto.randomUUID()

    const { data: suppressed, error: suppressionError } = await supabaseAdmin
      .from('suppressed_emails')
      .select('id')
      .eq('email', normalized)
      .maybeSingle()
    if (suppressionError) return { success: false, reason: 'suppression_check_failed' }
    if (suppressed) return { success: false, reason: 'email_suppressed' }

    let unsubscribeToken: string
    const { data: existingToken } = await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .select('token, used_at')
      .eq('email', normalized)
      .maybeSingle()
    if (existingToken?.token && !existingToken.used_at) {
      unsubscribeToken = existingToken.token
    } else if (!existingToken) {
      const fresh = generateToken()
      await supabaseAdmin
        .from('email_unsubscribe_tokens')
        .upsert({ token: fresh, email: normalized }, { onConflict: 'email', ignoreDuplicates: true })
      const { data: stored } = await supabaseAdmin
        .from('email_unsubscribe_tokens')
        .select('token')
        .eq('email', normalized)
        .maybeSingle()
      if (!stored?.token) return { success: false, reason: 'token_failed' }
      unsubscribeToken = stored.token
    } else {
      return { success: false, reason: 'email_suppressed' }
    }

    const element = React.createElement(template.component, input.templateData ?? {})
    const html = await render(element)
    const text = await render(element, { plainText: true })
    const subject =
      typeof template.subject === 'function'
        ? template.subject((input.templateData ?? {}) as Record<string, any>)
        : template.subject

    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: input.templateName,
      recipient_email: recipient,
      status: 'pending',
    })

    const { error: enqueueError } = await supabaseAdmin.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: recipient,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: 'transactional',
        label: input.templateName,
        idempotency_key: input.idempotencyKey ?? messageId,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    })
    if (enqueueError) {
      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId,
        template_name: input.templateName,
        recipient_email: recipient,
        status: 'failed',
        error_message: 'Failed to enqueue email',
      })
      return { success: false, reason: 'enqueue_failed' }
    }
    return { success: true }
  } catch (err) {
    console.error('sendTransactionalServer failed', input.templateName, err)
    return { success: false, reason: 'error' }
  }
}
