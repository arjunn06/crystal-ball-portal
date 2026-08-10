import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'

/* Brand tokens — the single source of truth for every email in this project.
   bg #0A0A0F · card #101014 · muted #1B1B21
   fg #FAFAFA · muted-fg #8B8B96
   Blue Pill / account #1E6BFF · Red Pill #E53935
   Fonts: Clash Display (display) + Archivo (body), with system fallbacks. */

export const BLUE = '#1E6BFF'
export const RED = '#E53935'
export const AMBER = '#FFC107'

export const LOGO_URL =
  'https://blueprint.ifvg.in/__l5e/assets-v1/b40491fd-d11d-4e81-88b1-77c53d546087/blueprint-mark.png'

export const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"Archivo", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
}
export const outerContainer = { padding: '32px 20px' }
export const card = {
  backgroundColor: '#101014',
  borderRadius: '12px',
  padding: '0 0 32px',
  overflow: 'hidden' as const,
  maxWidth: '520px',
  margin: '0 auto',
}
export const cardInner = { padding: '0 32px' }
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
export const link = { color: '#FAFAFA', textDecoration: 'underline' }
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
export function buttonWith(accent: string = BLUE) {
  return {
    backgroundColor: accent,
    borderRadius: '999px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    padding: '13px 24px',
    textDecoration: 'none',
    display: 'inline-block',
  }
}
export const button = buttonWith(BLUE)

/** Nested block with a title, body copy and usually a CTA. */
export const stepBox = {
  backgroundColor: '#1B1B21',
  borderRadius: '10px',
  padding: '20px',
  margin: '0 0 24px',
}
export const stepTitle = {
  ...clash,
  fontSize: '16px',
  fontWeight: 600,
  color: '#FAFAFA',
  margin: '0 0 8px',
}
export const stepText = {
  fontSize: '13px',
  color: '#8B8B96',
  lineHeight: '1.6',
  margin: '0 0 18px',
}

/** One-time code treatment (login code, reauthentication). */
export const codeBox = {
  backgroundColor: '#1B1B21',
  borderRadius: '10px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}
export function codeStyleWith(accent: string = BLUE) {
  return {
    fontFamily: '"JetBrains Mono", "Courier New", Courier, monospace',
    fontSize: '32px',
    fontWeight: 700,
    color: accent,
    letterSpacing: '0.25em',
    margin: 0,
  }
}

/** Quiet closing line. */
export const footnote = {
  fontSize: '12px',
  color: '#8B8B96',
  lineHeight: '1.6',
  margin: '24px 0 0',
}

const divider = { border: 'none', borderTop: '1px solid #1B1B21', margin: '28px 0 18px' }
const header = { padding: '28px 32px 20px' }
const logo = { display: 'block' as const }
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
  accent,
  children,
}: {
  preview: string
  eyebrow?: string
  eyebrowColor?: string
  accent?: string
  children: React.ReactNode
}) {
  const tone = accent ?? eyebrowColor ?? BLUE
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={outerContainer}>
          <Section style={card}>
            <Section style={{ ...topRule, backgroundColor: tone }} />
            <Section style={header}>
              <Img
                src={LOGO_URL}
                width="30"
                height="30"
                alt="Blueprint"
                style={logo}
              />
            </Section>
            <Section style={cardInner}>
              {eyebrow ? <Text style={eyebrowStyle(tone)}>{eyebrow}</Text> : null}
              {children}
              <Hr style={divider} />
              <Text style={brandFooter}>Blueprint · by Arjun IFVG</Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const topRule = { height: '3px', lineHeight: '3px', fontSize: '1px' }

export { Heading, Text as EmailText }
