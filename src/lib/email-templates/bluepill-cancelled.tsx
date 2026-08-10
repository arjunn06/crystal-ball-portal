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
  accessUntil?: string
  resubscribeUrl?: string
}

const BluePillCancelled = ({ name, accessUntil, resubscribeUrl }: Props) => (
  <EmailShell
    preview="Your Blue Pill membership has been cancelled"
    eyebrow="BLUE PILL · SUBSCRIPTION CANCELLED"
    eyebrowColor="#8B8B96"
  >
    <Heading style={h1}>
      {name ? `${name}, your membership is cancelled.` : 'Your membership is cancelled.'}
    </Heading>
    <Text style={text}>
      Your Blue Pill subscription has been cancelled and you won't be charged again. No further
      action is needed from your side.
    </Text>

    <Section style={infoBox}>
      <Text style={rowLabel}>Access until</Text>
      <Text style={{ ...rowValue, margin: 0 }}>
        {accessUntil ?? 'The end of your current billing period'}
      </Text>
    </Section>

    <Text style={text}>
      After that date your dashboard access and members-only Discord role are removed. Come back
      whenever you like — your account and progress stay exactly where you left them.
    </Text>

    <Button style={button} href={resubscribeUrl ?? 'https://blueprint.ifvg.in/bluepill'}>
      Reactivate my membership
    </Button>

    <Text style={{ ...text, margin: '24px 0 0' }}>
      <strong style={strong}>Cancelled by mistake?</strong> Reactivating takes under a minute and
      picks up right where you stopped.
    </Text>
  </EmailShell>
)

export const template = {
  component: BluePillCancelled,
  subject: 'Arjun IFVG — Your Blue Pill membership has been cancelled',
  displayName: 'Blue Pill subscription cancelled',
  previewData: {
    name: 'Arjun',
    accessUntil: '10 September 2026',
    resubscribeUrl: 'https://blueprint.ifvg.in/bluepill',
  },
} satisfies TemplateEntry

export default BluePillCancelled
