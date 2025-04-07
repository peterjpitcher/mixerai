// @ts-ignore: Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore: Deno imports
import { getInvitationEmailTemplate } from '../shared/email-templates.ts'
// @ts-ignore: Deno imports
import { sendEmail } from '../shared/send-email.ts'

interface CreateInvitationBody {
  email: string
  roleId: string
  brandIds: string[]
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore: Deno env
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // @ts-ignore: Deno env
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') },
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Invalid token')
    }

    // Check if user has permission to create invitations
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id)

    const userRoles = roles?.map((r: any) => r.role.name) || []
    if (!userRoles.some((role: string) => ['admin', 'brand_approver'].includes(role))) {
      throw new Error('Unauthorized')
    }

    const { email, roleId, brandIds }: CreateInvitationBody = await req.json()

    // Validate input
    if (!email || !roleId || !brandIds?.length) {
      throw new Error('Missing required fields')
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw new Error('User already exists')
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabaseClient
      .from('invitations')
      .select('id, status')
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      throw new Error('User already has a pending invitation')
    }

    // Get role name for the email
    const { data: role } = await supabaseClient
      .from('roles')
      .select('name')
      .eq('id', roleId)
      .single()

    if (!role) {
      throw new Error('Invalid role')
    }

    // Get inviter's email
    const { data: inviter } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (!inviter) {
      throw new Error('Inviter profile not found')
    }

    // Set expiry date to 7 days from now
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 7)

    // Create invitation
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('invitations')
      .insert({
        email,
        role_id: roleId,
        brand_ids: brandIds,
        invited_by: user.id,
        status: 'pending',
        expiry_date: expiryDate.toISOString(),
      })
      .select()
      .single()

    if (invitationError) {
      throw invitationError
    }

    // Generate accept URL
    const acceptUrl = `${Deno.env.get('SITE_URL')}/auth/accept-invitation?token=${invitation.id}`

    // Send invitation email
    const emailTemplate = getInvitationEmailTemplate({
      email,
      role: role.name,
      acceptUrl,
      expiryDate: expiryDate.toLocaleDateString(),
    })

    await sendEmail({
      to: email,
      subject: 'You have been invited to MixerAI',
      ...emailTemplate,
    })

    return new Response(
      JSON.stringify({ message: 'Invitation created successfully', data: invitation }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 