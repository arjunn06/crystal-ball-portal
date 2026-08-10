import type { ComponentType } from 'react'
import { template as redPillEnrolledTemplate } from './redpill-enrolled'
import { template as bluePillStartedTemplate } from './bluepill-subscription-started'
import { template as bluePillPaymentDueTemplate } from './bluepill-payment-due'
import { template as bluePillCancelledTemplate } from './bluepill-cancelled'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'redpill-enrolled': redPillEnrolledTemplate,
  'bluepill-subscription-started': bluePillStartedTemplate,
  'bluepill-payment-due': bluePillPaymentDueTemplate,
  'bluepill-cancelled': bluePillCancelledTemplate,
}
