import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface RedPillEnrolledProps {
  name?: string
  claimUrl?: string
}

const RedPillEnrolled = ({ name, claimUrl }: RedPillEnrolledProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're enrolled in The Red Pill — claim your Discord role next</Preview>
    <Body style={main}>
      <Container style={outerContainer}>
        <Section style={card}>
          <Text style={eyebrow}>RED PILL · ENROLMENT CONFIRMED</Text>
          <Heading style={h1}>{name ? `You're in, ${name}.` : "You're in."}</Heading>
          <Text style={text}>
            Your seat in The Red Pill — one month of live IFVG training on Zoom — is
            confirmed. Payment received, nothing else to pay.
          </Text>

          <Section style={stepBox}>
            <Text style={stepTitle}>Next step: claim your Discord role</Text>
            <Text style={stepText}>
              Connect your Discord account to join the private server and get your
              members role automatically. This is where all announcements, session
              links and trade breakdowns are posted.
            </Text>
            <Button style={button} href={claimUrl ?? 'https://blueprint.ifvg.in/app/discord'}>
              Claim my Discord role
            </Button>
          </Section>

          <Text style={text}>
            <strong style={strong}>When do classes start?</strong> The cohort begins
            once all slots are filled. Keep an eye on the Discord — we'll announce the
            exact start date and session times there, so make sure your role is
            claimed before then.
          </Text>

          <Hr style={divider} />
          <Text style={brandFooter}>Blueprint by Arjun IFVG</Text>
        </Section>
      </Container>
    </Body>
  </Html>
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

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"Archivo", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
}

const outerContainer = { padding: '32px 20px' }

const card = {
  backgroundColor: '#101014',
  borderRadius: '12px',
  padding: '32px',
  maxWidth: '520px',
  margin: '0 auto',
}

const eyebrow = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.16em',
  color: '#E53935',
  margin: '0 0 12px',
}

const h1 = {
  fontFamily: '"Clash Display", "Inter", ui-sans-serif, system-ui, sans-serif',
  fontSize: '26px',
  fontWeight: 600,
  color: '#FAFAFA',
  margin: '0 0 16px',
  letterSpacing: '-0.02em',
}

const text = {
  fontSize: '14px',
  color: '#8B8B96',
  lineHeight: '1.65',
  margin: '0 0 20px',
}

const strong = { color: '#FAFAFA' }

const stepBox = {
  backgroundColor: '#1B1B21',
  borderRadius: '10px',
  padding: '20px',
  margin: '0 0 24px',
}

const stepTitle = {
  fontFamily: '"Clash Display", "Inter", ui-sans-serif, system-ui, sans-serif',
  fontSize: '16px',
  fontWeight: 600,
  color: '#FAFAFA',
  margin: '0 0 8px',
}

const stepText = {
  fontSize: '13px',
  color: '#8B8B96',
  lineHeight: '1.6',
  margin: '0 0 18px',
}

const button = {
  backgroundColor: '#E53935',
  borderRadius: '999px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600,
  padding: '12px 22px',
  textDecoration: 'none',
  display: 'inline-block',
}

const divider = {
  border: 'none',
  borderTop: '1px solid #1B1B21',
  margin: '24px 0 16px',
}

const brandFooter = {
  fontFamily: '"Clash Display", "Inter", ui-sans-serif, system-ui, sans-serif',
  fontSize: '12px',
  color: '#8B8B96',
  margin: 0,
  textAlign: 'center' as const,
  letterSpacing: '0.05em',
}