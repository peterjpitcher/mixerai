'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { User, LogOut, Settings } from 'lucide-react'

export default function UserButton() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-2 hover:bg-gray-800"
      >
        <User className="h-6 w-6 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-gray-800 shadow-lg">
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false)
                router.push('/settings')
              }}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </button>
            <button
              onClick={() => {
                setIsOpen(false)
                handleSignOut()
              }}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 