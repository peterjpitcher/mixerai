'use client'

import { Logo } from '@/components/Logo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-primary">
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-8">
          <Logo className="h-12 w-auto" />
        </div>
        <div className="w-full max-w-md px-4">
          {children}
        </div>
      </div>
    </div>
  )
} 