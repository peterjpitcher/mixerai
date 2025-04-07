'use client'

import { Navigation } from '@/components/Navigation'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import SupabaseProvider from '@/components/providers/SupabaseProvider'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth')

  return (
    <body className={cn('min-h-screen bg-background font-sans antialiased', inter.className)}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SupabaseProvider>
          {isAuthPage ? (
            children
          ) : (
            <Navigation>
              {children}
            </Navigation>
          )}
        </SupabaseProvider>
      </ThemeProvider>
    </body>
  )
} 