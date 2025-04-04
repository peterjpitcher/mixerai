import { createBrowserClient } from '@supabase/ssr'
import { type Database } from '@/types/database'

export function createClientSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function signIn(email: string, password: string) {
  const supabase = createClientSupabaseClient()
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Sign in error:', error)
    return { data: null, error }
  }
}

export async function signOut() {
  const supabase = createClientSupabaseClient()
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Sign out error:', error)
    return { error }
  }
}

export async function getClientSession() {
  const supabase = createClientSupabaseClient()
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return { session, error: null }
  } catch (error) {
    console.error('Get session error:', error)
    return { session: null, error }
  }
}

export async function updatePassword(password: string) {
  const supabase = createClientSupabaseClient()
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: password,
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Update password error:', error)
    return { data: null, error }
  }
}

export async function resetPassword(email: string) {
  const supabase = createClientSupabaseClient()
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Reset password error:', error)
    return { data: null, error }
  }
} 