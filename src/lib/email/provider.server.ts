// Email delivery via Resend's HTTP API (works on Cloudflare Workers, no SMTP).
// Env: RESEND_API_KEY (send), SEND_EMAIL_HOOK_SECRET (Supabase Send Email Hook),
// RESEND_WEBHOOK_SECRET (Resend bounce/complaint webhook).

export class EmailProviderError extends Error {
  status: number
  retryAfterSeconds: number | null
  constructor(message: string, status: number, retryAfterSeconds: number | null = null) {
    super(message)
    this.name = 'EmailProviderError'
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export interface OutgoingEmail {
  to: string
  from: string
  subject: string
  html: string
  text?: string
  headers?: Record<string, string>
  idempotencyKey?: string
}

export async function sendEmail(email: OutgoingEmail): Promise<{ id: string | null }> {
  const apiKey = process.env['RESEND_API_KEY']
  if (!apiKey) throw new EmailProviderError('RESEND_API_KEY not configured', 403)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(email.idempotencyKey ? { 'Idempotency-Key': email.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: email.from,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      headers: email.headers,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const retryAfter = Number(res.headers.get('retry-after'))
    throw new EmailProviderError(
      `Resend ${res.status}: ${body.slice(0, 500)}`,
      res.status,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
    )
  }
  const json = (await res.json().catch(() => ({}))) as { id?: string }
  return { id: json.id ?? null }
}

export class WebhookVerificationError extends Error {}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff ^= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/**
 * Verifies a Standard Webhooks request (used by Supabase Auth hooks and by
 * Resend/Svix). Returns the raw body on success, throws WebhookVerificationError.
 */
export async function verifyStandardWebhook(request: Request, secret: string): Promise<string> {
  const h = request.headers
  const id = h.get('webhook-id') ?? h.get('svix-id')
  const timestamp = h.get('webhook-timestamp') ?? h.get('svix-timestamp')
  const signatures = h.get('webhook-signature') ?? h.get('svix-signature')
  if (!id || !timestamp || !signatures) throw new WebhookVerificationError('missing_headers')

  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 5 * 60) {
    throw new WebhookVerificationError('stale_timestamp')
  }

  const body = await request.text()
  const keyBytes = b64ToBytes(secret.replace(/^v1,/, '').replace(/^whsec_/, ''))
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`))
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)))

  const ok = signatures
    .split(' ')
    .map((s) => s.split(',')[1] ?? '')
    .some((sig) => timingSafeEqual(sig, expected))
  if (!ok) throw new WebhookVerificationError('invalid_signature')
  return body
}
