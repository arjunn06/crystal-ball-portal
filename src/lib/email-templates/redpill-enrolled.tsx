import * as React from 'react'
import { Button, Section, Text } from '@react-email/components'
import {
  EmailShell,
  Heading,
  RED,
  buttonWith,
  footnote,
  h1,
  stepBox,
  stepText,
  stepTitle,
  strong,
  text,
} from './_shell'
import type { TemplateEntry } from './registry'

interface RedPillEnrolledProps {
  name?: string
  claimUrl?: string
}

const RedPillEnrolled = ({ name, claimUrl }: RedPillEnrolledProps) => (
  <EmailShell
    preview="You're enrolled in The Red Pill — claim your Discord role next"
    eyebrow="RED PILL · ENROLMENT CONFIRMED"
    accent={RED}
  >
    <Heading style={h1}>{name ? `You're in, ${name}.` : "You're in."}</Heading>
    <Text style={text}>
      Your seat in The Red Pill — one month of live IFVG training on Zoom — is confirmed. Payment
      received, nothing else to pay.
    </Text>

    <Section style={stepBox}>
      <Text style={stepTitle}>Next step: claim your Discord role</Text>
      <Text style={stepText}>
        Connect your Discord account to join the private server and get your members role
        automatically. Announcements, session links and trade breakdowns all live there.
      </Text>
      <Button
        style={buttonWith(RED)}
        href={claimUrl ?? 'https://blueprint.ifvg.in/app/discord'}
      >
        Claim my Discord role
      </Button>
    </Section>

    <Text style={text}>
      <strong style={strong}>When do classes start?</strong> The cohort begins once all slots are
      filled. We'll announce the start date and session times in Discord, so claim your role before
      then.
    </Text>

    <Text style={footnote}>Questions? Reply to this email and we'll get back to you.</Text>
  </EmailShell>
)

export const template = {
  component: RedPillEnrolled,
  subject: 'Arjun IFVG — You\u2019re enrolled in The Red Pill',
  displayName: 'Red Pill enrolment confirmation',
  previewData: {
    name: 'Arjun',
    claimUrl: 'https://blueprint.ifvg.in/app/discord',
  },
} satisfies TemplateEntry

export default RedPillEnrolled