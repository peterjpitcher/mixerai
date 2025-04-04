'use client'

import { createContext, useContext, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

type SupabaseContext = {
  user: User | null
  userLoading: boolean
  userPermissions: {
    role_name: string
    permissions: string[]
    accessible_brand_names: string[]
  } | null
  supabase: ReturnType<typeof createBrowserClient<Database>>
}

const Context = createContext<SupabaseContext>({
  user: null,
  userLoading: true,
  userPermissions: null,
  supabase: createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ),
})

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Default admin user for development
  const [user] = useState<User>({
    id: 'dev-admin',
    email: 'peter.pitcher@genmills.com',
    role: 'authenticated',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  } as User)

  // Default admin permissions
  const [userPermissions] = useState<SupabaseContext['userPermissions']>({
    role_name: 'admin',
    permissions: ['*'],
    accessible_brand_names: ['*']
  })

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return (
    <Context.Provider
      value={{
        user,
        userLoading: false,
        userPermissions,
        supabase,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
} 