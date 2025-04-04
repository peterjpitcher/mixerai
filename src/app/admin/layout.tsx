import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin | MixerAI',
  description: 'Admin dashboard and management',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="p-8">
      {children}
    </div>
  )
} 