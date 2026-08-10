import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { EmailShell, Heading, button, footnote, h1, strong, text } from './_shell'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ recipient, confirmationUrl }: SignupEmailProps) => (
  <EmailShell preview="Confirm your email for Blueprint" eyebrow="ACCOUNT · CONFIRM EMAIL">
    <Heading style={h1}>Confirm your email</Heading>
    <Text style={text}>
      One click and your Blueprint account is ready. We just need to confirm{' '}
      <strong style={strong}>{recipient}</strong> belongs to you.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Confirm my email
    </Button>
    <Text style={footnote}>
      Didn't create an account? You can ignore this email.
    </Text>
  </EmailShell>
)

export default SignupEmail