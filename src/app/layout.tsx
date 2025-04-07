import type { Metadata } from 'next'
import './globals.css'
import LayoutWrapper from './LayoutWrapper'

export const metadata: Metadata = {
  title: 'MixerAI',
  description: 'AI-powered content creation platform',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <LayoutWrapper>
        {children}
      </LayoutWrapper>
    </html>
  )
}
