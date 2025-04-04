import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'User Management | MixerAI',
  description: 'Manage user accounts and permissions',
}

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 