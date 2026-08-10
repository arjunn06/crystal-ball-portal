import * as React from 'react'
import { Section, Text } from '@react-email/components'
import { EmailShell, Heading, codeBox, codeStyleWith, footnote, h1, text } from './_shell'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <EmailShell preview="Your Blueprint verification code" eyebrow="ACCOUNT · VERIFY IDENTITY">
    <Heading style={h1}>Confirm it's you</Heading>
    <Text style={text}>
      Enter the six digits below to confirm this action on your account. The code expires shortly.
    </Text>
    <Section style={codeBox}>
      <Text style={codeStyleWith()}>{token}</Text>
    </Section>
    <Text style={footnote}>
      Didn't request this? You can ignore this email.
    </Text>
  </EmailShell>
)

export default ReauthenticationEmail