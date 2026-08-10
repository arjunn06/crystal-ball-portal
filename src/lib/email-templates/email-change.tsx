import * as React from 'react'
import { Button, Section, Text } from '@react-email/components'
import {
  EmailShell,
  Heading,
  button,
  footnote,
  h1,
  infoBox,
  rowLabel,
  rowValue,
  text,
} from './_shell'

interface EmailChangeEmailProps {
  siteName: string
  // oldEmail is the user's current address (HookData.OldEmail). For the
  // NEW-recipient half of a secure email_change fanout, `email` equals the
  // recipient (NEW), so the "from" line must render oldEmail to read
  // "from OLD to NEW" instead of "from NEW to NEW".
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <EmailShell preview="Confirm your new email for Blueprint" eyebrow="ACCOUNT · EMAIL CHANGE">
    <Heading style={h1}>Confirm your new email</Heading>
    <Text style={text}>
      You asked to move your Blueprint account to a new address. Confirm it below and we'll make the
      switch.
    </Text>

    <Section style={infoBox}>
      <Text style={rowLabel}>Current</Text>
      <Text style={rowValue}>{oldEmail}</Text>
      <Text style={rowLabel}>New</Text>
      <Text style={{ ...rowValue, margin: 0 }}>{newEmail}</Text>
    </Section>

    <Button style={button} href={confirmationUrl}>
      Confirm the change
    </Button>
    <Text style={footnote}>
      Didn't request this? Secure your account straight away — don't use the link above.
    </Text>
  </EmailShell>
)

export default EmailChangeEmail