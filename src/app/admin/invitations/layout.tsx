import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Invitations | MixerAI',
  description: 'Manage user invitations',
}

export default function InvitationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 