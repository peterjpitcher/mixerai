// @ts-ignore: Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../shared/cors'
import { getInvitationEmailTemplate } from '../shared/email-templates'
import { sendEmail } from '../shared/send-email'

// @ts-ignore: Deno env
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface Role {
  name: string
}

interface UserRole {
  role: Role
}

interface Invitation {
  id: string
  email: string
  status: string
  role: Role
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const { invitationId } = await req.json()
    if (!invitationId) {
      throw new Error('No invitation ID provided')
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) throw userError

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id)
    
    const userRoles = roles?.map((r: { role: { name: string } }) => r.role.name) || []
    if (!userRoles.some((role: string) => ['admin', 'brand_approver'].includes(role))) {
      throw new Error('Unauthorized')
    }

    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*, role:roles(name)')
      .eq('id', invitationId)
      .single()
    
    if (invitationError) throw invitationError
    if (!invitation) throw new Error('Invitation not found')
    if (invitation.status !== 'pending') {
      throw new Error('Can only resend pending invitations')
    }

    const newExpiryDate = new Date()
    newExpiryDate.setDate(newExpiryDate.getDate() + 7)

    const { error: updateError } = await supabase
      .from('invitations')
      .update({ expiry_date: newExpiryDate.toISOString() })
      .eq('id', invitationId)

    if (updateError) throw updateError

    const acceptUrl = `${Deno.env.get('FRONTEND_URL')}/auth/accept-invitation?token=${invitationId}`

    const emailTemplate = getInvitationEmailTemplate({
      email: invitation.email,
      role: invitation.role.name,
      acceptUrl,
      expiryDate: newExpiryDate.toLocaleDateString(),
    })

    await sendEmail({
      to: invitation.email,
      subject: 'Your invitation has been resent',
      ...emailTemplate,
    })

    return new Response(
      JSON.stringify({ message: 'Invitation resent successfully' }),
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