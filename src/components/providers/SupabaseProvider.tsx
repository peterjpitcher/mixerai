'use client'

import { createContext, useContext, useState, useEffect } from 'react'
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
  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [userPermissions, setUserPermissions] = useState<SupabaseContext['userPermissions']>(null)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          // Fetch user permissions
          const { data: permissions, error: permissionsError } = await supabase
            .from('user_roles')
            .select('role_name, permissions, accessible_brand_names')
            .eq('user_id', currentUser.id)
            .single()

          if (!permissionsError && permissions) {
            setUserPermissions(permissions)
          }
        }
      } catch (error) {
        console.error('Error loading user:', error)
        setUser(null)
        setUserPermissions(null)
      } finally {
        setUserLoading(false)
      }
    }

    // Initial user fetch
    getUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setUserLoading(true)

      if (currentUser) {
        // Fetch user permissions
        const { data: permissions, error: permissionsError } = await supabase
          .from('user_roles')
          .select('role_name, permissions, accessible_brand_names')
          .eq('user_id', currentUser.id)
          .single()

        if (!permissionsError && permissions) {
          setUserPermissions(permissions)
        }
      } else {
        setUserPermissions(null)
      }
      
      setUserLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <Context.Provider
      value={{
        user,
        userLoading,
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