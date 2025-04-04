import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Content | MixerAI',
  description: 'Manage your AI-generated content',
}

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 