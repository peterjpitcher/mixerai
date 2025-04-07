'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserButton from '@/components/UserButton'
import Notifications from '@/components/Notifications'
import { Logo } from '@/components/Logo'
import { SignOutButton } from '@/components/SignOutButton'
import { cn } from '@/lib/utils'
import { FileText, ShoppingBag, Utensils, Mail, MessageSquare, Code, Database } from 'lucide-react'

const mainNavItems = [
  { href: '/content', label: 'Content' },
  { href: '/admin/brands', label: 'Brands' },
  { href: '/invitations', label: 'Invitations' },
]

const contentToolsItems = [
  { href: '/content/create/article', label: 'Create Article', icon: FileText },
]

const comingSoonItems = [
  { href: '/content/create/product', label: 'Create Product', icon: ShoppingBag, disabled: true },
  { href: '/content/create/recipe', label: 'Create Recipe', icon: Utensils, disabled: true },
  { href: '/content/create/email', label: 'Create Email', icon: Mail, disabled: true },
  { href: '/content/create/social', label: 'Create Social', icon: MessageSquare, disabled: true },
]

const technicalToolsItems = [
  { href: '/tools/metadata', label: 'Metadata Generation', icon: Code },
  { href: '/tools/alt-text', label: 'Alt Text Generation', icon: Database },
]

interface NavigationProps {
  children: React.ReactNode
}

export function Navigation({ children }: NavigationProps) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-primary">
        <div className="container flex h-16 items-center">
          <div className="mr-8">
            <Logo />
          </div>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-primary-foreground/80',
                  pathname?.startsWith(item.href)
                    ? 'text-primary-foreground'
                    : 'text-primary-foreground/60'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center space-x-4">
            <Notifications />
            <UserButton />
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Left Navigation */}
        <aside className="w-64 bg-secondary border-r">
          <nav className="p-4 space-y-6">
            {/* Content Tools Section */}
            <div>
              <h2 className="px-4 text-sm font-semibold text-white/70 mb-2">Content Tools</h2>
              <div className="space-y-1">
                {contentToolsItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center w-full px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      'text-white hover:bg-secondary-600',
                      pathname === item.href && 'bg-secondary-600'
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Coming Soon Section */}
            <div>
              <h2 className="px-4 text-sm font-semibold text-white/70 mb-2">Coming Soon</h2>
              <div className="space-y-1">
                {comingSoonItems.map((item) => (
                  <Link
                    key={item.href}
                    href="#"
                    className={cn(
                      'flex items-center w-full px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      'text-white hover:bg-secondary-600',
                      'opacity-50 cursor-not-allowed hover:bg-transparent'
                    )}
                    onClick={(e) => e.preventDefault()}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Technical Tools Section */}
            <div>
              <h2 className="px-4 text-sm font-semibold text-white/70 mb-2">Technical Tools</h2>
              <div className="space-y-1">
                {technicalToolsItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center w-full px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      'text-white hover:bg-secondary-600',
                      pathname === item.href && 'bg-secondary-600'
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="container">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 