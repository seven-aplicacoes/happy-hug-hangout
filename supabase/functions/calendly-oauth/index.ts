import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, code } = await req.json()

    if (action === 'exchange_code') {
      if (!code) throw new Error('Missing code')

      const clientId = Deno.env.get('CALENDLY_CLIENT_ID')
      const clientSecret = Deno.env.get('CALENDLY_CLIENT_SECRET')
      const redirectUri = Deno.env.get('CALENDLY_REDIRECT_URI')

      const response = await fetch('https://auth.calendly.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri!,
        })
      })

      const data = await response.json()
      if (!response.ok) {
        console.error('Calendly token exchange error:', data)
        throw new Error(data.error_description || data.error || 'Failed to exchange code')
      }

      // Save tokens to DB
      const { error: dbError } = await supabaseClient
        .from('consultant_calendar_integrations')
        .upsert({
          consultant_id: user.id,
          provider: 'calendly',
          access_token_encrypted: data.access_token, // Ideally encrypt this if you have an encryption key
          refresh_token_encrypted: data.refresh_token,
          expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
          scope: data.scope,
          provider_user_uri: data.owner,
          status: 'active'
        }, { onConflict: 'consultant_id, provider' })

      if (dbError) throw dbError

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('Invalid action')
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
