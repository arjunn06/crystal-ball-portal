import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export const BLUE = '#1E6BFF'

export const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"Archivo", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
}
export const outerContainer = { padding: '32px 20px' }
export const card = {
  backgroundColor: '#101014',
  borderRadius: '12px',
  padding: '32px',
  maxWidth: '520px',
  margin: '0 auto',
}
export const clash = {
  fontFamily: '"Clash Display", "Inter", ui-sans-serif, system-ui, sans-serif',
}
export const h1 = {
  ...clash,
  fontSize: '26px',
  fontWeight: 600,
  color: '#FAFAFA',
  margin: '0 0 16px',
  letterSpacing: '-0.02em',
}
export const text = {
  fontSize: '14px',
  color: '#8B8B96',
  lineHeight: '1.65',
  margin: '0 0 20px',
}
export const strong = { color: '#FAFAFA' }
export const infoBox = {
  backgroundColor: '#1B1B21',
  borderRadius: '10px',
  padding: '18px 20px',
  margin: '0 0 24px',
}
export const rowLabel = {
  fontSize: '11px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: '#8B8B96',
  margin: '0 0 4px',
}
export const rowValue = { fontSize: '15px', color: '#FAFAFA', margin: '0 0 14px', fontWeight: 600 }
export const button = {
  backgroundColor: BLUE,
  borderRadius: '999px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600,
  padding: '12px 22px',
  textDecoration: 'none',
  display: 'inline-block',
}
const divider = { border: 'none', borderTop: '1px solid #1B1B21', margin: '24px 0 16px' }
const brandFooter = {
  ...clash,
  fontSize: '12px',
  color: '#8B8B96',
  margin: 0,
  textAlign: 'center' as const,
  letterSpacing: '0.05em',
}

export function eyebrowStyle(color = BLUE) {
  return {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.16em',
    color,
    margin: '0 0 12px',
  }
}

export function EmailShell({
  preview,
  eyebrow,
  eyebrowColor,
  children,
}: {
  preview: string
  eyebrow: string
  eyebrowColor?: string
  children: React.ReactNode
}) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={outerContainer}>
          <Section style={card}>
            <Text style={eyebrowStyle(eyebrowColor)}>{eyebrow}</Text>
            {children}
            <Hr style={divider} />
            <Text style={brandFooter}>Blueprint by Arjun IFVG</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export { Heading, Text as EmailText }
