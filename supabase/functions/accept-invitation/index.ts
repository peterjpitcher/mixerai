// @ts-ignore: Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../shared/cors'

interface AcceptInvitationBody {
  token: string
}

interface DenoRequest extends Request {
  json: () => Promise<any>
}

declare const Deno: {
  env: {
    get: (key: string) => string | undefined
  }
  serve: (handler: (req: DenoRequest) => Promise<Response>) => void
}

Deno.serve(async (req: DenoRequest) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false
        }
      }
    )

    const { token } = await req.json() as AcceptInvitationBody

    if (!token) {
      throw new Error('Token is required')
    }

    const { data: invitation, error: invitationError } = await supabaseClient
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (invitationError) {
      throw invitationError
    }

    if (!invitation) {
      throw new Error('Invitation not found')
    }

    if (invitation.accepted_at) {
      throw new Error('Invitation already accepted')
    }

    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('Invitation expired')
    }

    const { error: updateError } = await supabaseClient
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    if (updateError) {
      throw updateError
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}) 