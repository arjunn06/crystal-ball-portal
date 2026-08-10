import * as React from 'react'
import { Section, Text } from '@react-email/components'
import {
  EmailShell,
  Heading,
  codeBox,
  codeStyleWith,
  footnote,
  h1,
  text,
} from './_shell'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
  token?: string
}

export const MagicLinkEmail = ({ token }: MagicLinkEmailProps) => (
  <EmailShell preview="Your Blueprint login code" eyebrow="ACCOUNT · LOGIN CODE">
    <Heading style={h1}>Your login code</Heading>
    <Text style={text}>
      Enter the six digits below to finish signing in. The code expires in a few minutes.
    </Text>
    <Section style={codeBox}>
      <Text style={codeStyleWith()}>{token}</Text>
    </Section>
    <Text style={footnote}>
      Didn't try to sign in? You can ignore this email — nothing changes until the code is used.
    </Text>
  </EmailShell>
)

export default MagicLinkEmail