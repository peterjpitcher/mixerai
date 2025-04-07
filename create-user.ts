import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

async function createUser() {
  try {
    console.log('Attempting to create user...')
    
    const { data, error } = await supabase.auth.signUp({
      email: 'peter.pitcher@genmills.com',
      password: 'Pitcher1458955',
      options: {
        data: {
          role: 'admin'
        }
      }
    })

    if (error) {
      console.error('Error creating user:', error)
      return
    }

    console.log('User created successfully:', {
      id: data.user?.id,
      email: data.user?.email,
      role: data.user?.user_metadata.role
    })
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

createUser() 