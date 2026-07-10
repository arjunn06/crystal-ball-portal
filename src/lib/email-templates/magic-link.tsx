import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Hr,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
  token?: string
}

export const MagicLinkEmail = ({ siteName, token }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Arjun IFVG login code</Preview>
    <Body style={main}>
      <Container style={outerContainer}>
        <Section style={card}>
          <Heading style={h1}>Sign in to {siteName}</Heading>
          <Text style={text}>
            Use the 6-digit code below to finish signing in. This code expires
            in a few minutes.
          </Text>
          <Section style={codeBox}>
            <Text style={codeStyle}>{token}</Text>
          </Section>
          <Text style={footer}>
            If you didn't request this code, you can safely ignore this email.
          </Text>
          <Hr style={divider} />
          <Text style={brandFooter}>Blueprint by Arjun IFVG</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

/* Brand tokens
   bg #0A0A0F, card #101014, muted #1B1B21,
   fg #FAFAFA, muted-fg #8B8B96, Red #E53935, Purple #AB47BC
   Fonts: Clash Display (display) + Archivo (body)
*/

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '"Archivo", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
}

const outerContainer = {
  padding: '32px 20px',
}

const card = {
  backgroundColor: '#101014',
  borderRadius: '12px',
  padding: '32px',
  maxWidth: '480px',
  margin: '0 auto',
}

const h1 = {
  fontFamily:
    '"Clash Display", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  fontSize: '24px',
  fontWeight: 600,
  color: '#FAFAFA',
  margin: '0 0 16px',
  letterSpacing: '-0.02em',
}

const text = {
  fontSize: '14px',
  color: '#8B8B96',
  lineHeight: '1.6',
  margin: '0 0 24px',
}

const codeBox = {
  backgroundColor: '#1B1B21',
  borderRadius: '10px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

const codeStyle = {
  fontFamily: '"JetBrains Mono", "Courier New", monospace',
  fontSize: '32px',
  fontWeight: 700,
  color: '#E53935',
  letterSpacing: '0.25em',
  margin: 0,
}

const footer = {
  fontSize: '12px',
  color: '#8B8B96',
  margin: '0 0 0',
}

const divider = {
  border: 'none',
  borderTop: '1px solid #1B1B21',
  margin: '24px 0 16px',
}

const brandFooter = {
  fontFamily:
    '"Clash Display", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  fontSize: '12px',
  color: '#8B8B96',
  margin: 0,
  textAlign: 'center' as const,
  letterSpacing: '0.05em',
}
