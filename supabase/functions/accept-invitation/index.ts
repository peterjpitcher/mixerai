// @ts-ignore: Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../shared/cors.ts'

interface AcceptInvitationBody {
  token: string
  name: string
  password: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get invitation details from request body
    const { token, name, password }: AcceptInvitationBody = await req.json()
    if (!token || !name || !password) {
      throw new Error('Missing required fields')
    }

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', token)
      .single()

    if (invitationError) throw invitationError
    if (!invitation) throw new Error('Invitation not found')
    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer valid')
    }

    // Check if invitation has expired
    if (new Date(invitation.expiry_date) < new Date()) {
      // Update invitation status to expired
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', token)

      throw new Error('Invitation has expired')
    }

    // Create user account
    const { data: auth, error: signUpError } = await supabase.auth.signUp({
      email: invitation.email,
      password: password,
    })

    if (signUpError) throw signUpError
    if (!auth.user) throw new Error('Failed to create user account')

    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: auth.user.id,
        email: invitation.email,
        name: name,
      })

    if (profileError) throw profileError

    // Call accept_invitation RPC
    const { error: acceptError } = await supabase.rpc('accept_invitation', {
      p_invitation_id: token,
      p_user_id: auth.user.id,
    })

    if (acceptError) throw acceptError

    return new Response(
      JSON.stringify({ message: 'Invitation accepted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 