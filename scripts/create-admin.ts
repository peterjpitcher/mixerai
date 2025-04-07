import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
  try {
    console.log('Creating admin user...')
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'peter.pitcher@genmills.com',
      password: 'Pitcher1458955',
      email_confirm: true,
      user_metadata: {
        full_name: 'Peter Pitcher'
      }
    })

    if (error) {
      console.error('Error creating admin user:', error)
      return
    }

    console.log('Admin user created successfully:', data)

    // Set the user's role to admin
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([
        {
          user_id: data.user.id,
          role: 'admin'
        }
      ])

    if (roleError) {
      console.error('Error setting admin role:', roleError)
      return
    }

    console.log('Admin role set successfully')
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createAdminUser() 