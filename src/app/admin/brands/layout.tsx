import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Brand Management | MixerAI',
  description: 'Manage and approve brand registrations',
}

export default function BrandsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 