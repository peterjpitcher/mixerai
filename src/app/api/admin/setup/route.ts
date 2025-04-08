import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Required environment variables NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Get user by email
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers()
    const user = users.find(u => u.email === email)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get admin role ID
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'admin')
      .single()

    if (roleError || !adminRole) {
      return NextResponse.json(
        { error: 'Admin role not found' },
        { status: 404 }
      )
    }

    // Check if user already has admin role
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role_id', adminRole.id)
      .single()

    if (existingRole) {
      return NextResponse.json(
        { message: 'User is already an admin' },
        { status: 200 }
      )
    }

    // Grant admin role to user
    const { error: insertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: user.id,
        role_id: adminRole.id,
      })

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to grant admin role' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Successfully granted admin role' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 