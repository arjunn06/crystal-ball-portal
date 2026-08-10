import * as React from 'react'
import { Button, Section, Text } from '@react-email/components'
import {
  EmailShell,
  Heading,
  button,
  h1,
  infoBox,
  rowLabel,
  rowValue,
  strong,
  text,
} from './_shell'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  amount?: string
  dueDate?: string
  billingUrl?: string
}

const BluePillPaymentDue = ({ name, amount, dueDate, billingUrl }: Props) => (
  <EmailShell
    preview="Action needed — your Blue Pill payment is due"
    eyebrow="BLUE PILL · PAYMENT DUE"
  >
    <Heading style={h1}>{name ? `${name}, a payment is due.` : 'A payment is due.'}</Heading>
    <Text style={text}>
      We couldn't collect your latest Blue Pill payment. Your access stays on for now, but it will
      pause if the charge isn't completed.
    </Text>

    <Section style={infoBox}>
      <Text style={rowLabel}>Amount due</Text>
      <Text style={rowValue}>{amount ?? '₹499'}</Text>
      <Text style={rowLabel}>Due</Text>
      <Text style={{ ...rowValue, margin: 0 }}>{dueDate ?? 'As soon as possible'}</Text>
    </Section>

    <Button style={button} href={billingUrl ?? 'https://blueprint.ifvg.in/app/settings'}>
      Complete payment
    </Button>

    <Text style={{ ...text, margin: '24px 0 0' }}>
      <strong style={strong}>Common cause:</strong> the mandate on your card or UPI needs
      re-authorisation, or funds were unavailable at the time of the charge. Retrying from Settings
      usually clears it in under a minute.
    </Text>
  </EmailShell>
)

export const template = {
  component: BluePillPaymentDue,
  subject: 'Arjun IFVG — Payment due on your Blue Pill membership',
  displayName: 'Blue Pill payment due',
  previewData: {
    name: 'Arjun',
    amount: '₹499',
    dueDate: '12 September 2026',
    billingUrl: 'https://blueprint.ifvg.in/app/settings',
  },
} satisfies TemplateEntry

export default BluePillPaymentDue
