import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SupabaseProvider from '@/components/providers/SupabaseProvider'
import { Navigation } from '@/components/Navigation'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MixerAI',
  description: 'AI-powered content creation platform',
  icons: {
    icon: [
      {
        url: '/icon.png',
        href: '/icon.png',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', inter.className)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SupabaseProvider>
            <Navigation>
              {children}
            </Navigation>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
