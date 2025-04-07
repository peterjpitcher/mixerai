// @ts-ignore: Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../shared/cors'

// @ts-ignore: Deno env
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface InvitationRequest {
  email: string
  role: string
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the request body
    const { email, role } = await req.json() as InvitationRequest

    if (!email || !role) {
      throw new Error('Email and role are required')
    }

    // Generate a secure invitation token
    const token = crypto.randomUUID()

    // Create invitation URL
    const inviteUrl = `${Deno.env.get('SITE_URL')}/auth/accept-invite?token=${token}`

    // Send email using your email service (e.g., SendGrid, Postmark, etc.)
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }]
        }],
        from: {
          email: 'noreply@mixerai.com',
          name: 'MixerAI'
        },
        subject: 'Invitation to join MixerAI',
        content: [{
          type: 'text/html',
          value: `
            <h2>Welcome to MixerAI!</h2>
            <p>You have been invited to join MixerAI as a ${role}.</p>
            <p>Click the button below to accept your invitation and create your account:</p>
            <a href="${inviteUrl}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              Accept Invitation
            </a>
            <p>This invitation will expire in 7 days.</p>
            <p>If you did not expect this invitation, please ignore this email.</p>
          `
        }]
      })
    })

    if (!emailResponse.ok) {
      throw new Error('Failed to send invitation email')
    }

    // Update the invitation record with the token
    const { error: updateError } = await supabaseClient
      .from('invitations')
      .update({ token })
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ message: 'Invitation sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 