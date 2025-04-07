import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Log configuration details
console.log('Supabase Configuration:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + '...',
  environment: process.env.NODE_ENV,
  isLocalhost: typeof window !== 'undefined' && window.location.hostname === 'localhost',
  timestamp: new Date().toISOString()
})

// Create Supabase client with enhanced debugging
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      debug: true, // Enable debug logging for auth
      storageKey: 'mixerai-auth-token',
      storage: {
        getItem: (key) => {
          console.log('Auth storage getItem:', key)
          return localStorage.getItem(key)
        },
        setItem: (key, value) => {
          console.log('Auth storage setItem:', key, value ? 'value present' : 'no value')
          localStorage.setItem(key, value)
        },
        removeItem: (key) => {
          console.log('Auth storage removeItem:', key)
          localStorage.removeItem(key)
        }
      }
    },
    global: {
      headers: {
        'x-client-info': 'mixerai-web'
      }
    }
  }
)

// Add event listeners for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', {
    event,
    session: session ? {
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      expires_at: session.expires_at
    } : null
  })
}) 