import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { EmailShell, Heading, button, footnote, h1, text } from './_shell'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <EmailShell preview="Reset your Blueprint password" eyebrow="ACCOUNT · PASSWORD RESET">
    <Heading style={h1}>Reset your password</Heading>
    <Text style={text}>
      Use the link below to choose a new password. It stays valid for a short while, then expires.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Choose a new password
    </Button>
    <Text style={footnote}>
      Didn't request this? Ignore this email — your current password stays active.
    </Text>
  </EmailShell>
)

export default RecoveryEmail