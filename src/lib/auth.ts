export const runtime = 'edge'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { headers, cookies } from 'next/headers'
import { type Database } from '@/types/database'

export async function createServerSupabaseClient() {
  const headersList = await headers()
  const cookieHeader = headersList.get('cookie') || ''
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieHeader
            .split(';')
            .find((c: string) => c.trim().startsWith(`${name}=`))
          if (!cookie) return undefined
          const value = cookie.split('=')[1]
          return decodeURIComponent(value)
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie error
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie error
          }
        },
      },
    }
  )
}

export async function getSession() {
  const supabase = await createServerSupabaseClient()
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export async function getUserPermissions(userId: string) {
  const supabase = await createServerSupabaseClient()
  try {
    const { data: permissions } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId)
      .single()
    return permissions
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export async function hasPermission(userId: string, permission: string) {
  const supabase = await createServerSupabaseClient()
  try {
    const { data: hasPermission } = await supabase
      .rpc('has_permission', {
        user_id: userId,
        required_permission: permission,
      })
    return hasPermission
  } catch (error) {
    console.error('Error:', error)
    return false
  }
}

export async function hasBrandAccess(userId: string, brandId: string) {
  const supabase = await createServerSupabaseClient()
  try {
    const { data: hasAccess } = await supabase
      .rpc('has_brand_access', {
        user_id: userId,
        target_brand_id: brandId,
      })
    return hasAccess
  } catch (error) {
    console.error('Error:', error)
    return false
  }
}

export async function createInvitation({
  email,
  roleId,
  brandIds,
  invitedBy,
}: {
  email: string
  roleId: string
  brandIds: string[]
  invitedBy: string
}) {
  const supabase = await createServerSupabaseClient()

  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', email)
    .single()

  if (existingUser) {
    throw new Error('User already exists')
  }

  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      email,
      role_id: roleId,
      brand_ids: brandIds,
      invited_by: invitedBy,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  // TODO: Send invitation email
  return invitation
}

export async function getInvitation(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data: invitation, error } = await supabase
    .from('invitations')
    .select('*, roles(*)')
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  return invitation
}

export async function acceptInvitation({
  invitationId,
  userId,
}: {
  invitationId: string
  userId: string
}) {
  const supabase = await createServerSupabaseClient()

  const { data: invitation } = await supabase
    .from('invitations')
    .select('role_id, brand_ids')
    .eq('id', invitationId)
    .single()

  if (!invitation) {
    throw new Error('Invitation not found')
  }

  // Begin transaction
  const { error: userRoleError } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role_id: invitation.role_id,
    })

  if (userRoleError) {
    throw userRoleError
  }

  // Add brand access
  if (invitation.brand_ids.length > 0) {
    const brandAccess = invitation.brand_ids.map((brandId: string) => ({
      user_id: userId,
      brand_id: brandId,
    }))

    const { error: brandAccessError } = await supabase
      .from('brand_users')
      .insert(brandAccess)

    if (brandAccessError) {
      throw brandAccessError
    }
  }

  // Update invitation status
  const { error: updateError } = await supabase
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', invitationId)

  if (updateError) {
    throw updateError
  }

  return true
} 