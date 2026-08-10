import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { EmailShell, Heading, button, footnote, h1, text } from './_shell'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <EmailShell preview="You've been invited to Blueprint" eyebrow="ACCOUNT · INVITATION">
    <Heading style={h1}>You're invited to Blueprint</Heading>
    <Text style={text}>
      Accept the invitation to set up your account and get access to the member area.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Accept invitation
    </Button>
    <Text style={footnote}>
      Weren't expecting this? You can ignore this email.
    </Text>
  </EmailShell>
)

export default InviteEmail