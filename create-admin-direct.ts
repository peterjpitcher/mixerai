import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import * as crypto from 'crypto'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

async function createAdminUser() {
  try {
    console.log('Creating admin user...')

    // First, get the admin role ID
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'admin')
      .single()

    if (roleError) {
      console.error('Error fetching admin role:', roleError)
      return
    }

    if (!roleData) {
      console.error('Admin role not found')
      return
    }

    const userId = uuidv4()
    const email = 'peter.pitcher@genmills.com'
    const password = 'Pitcher1458955'

    // Create user in auth.users
    const { error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'admin' }
    })

    if (userError) {
      console.error('Error creating user:', userError)
      return
    }

    console.log('User created successfully')

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        role_id: roleData.id
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return
    }

    console.log('Profile created successfully')
    console.log('Admin user creation complete')
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

createAdminUser() 