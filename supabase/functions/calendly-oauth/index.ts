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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Unauthorized')

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    const { action, code, redirect_uri } = await req.json()

    if (action === 'exchange_code') {
      if (!isAdmin) throw new Error('Only admins can connect the central Calendly account')
      if (!code) throw new Error('Missing code')

      const clientId = Deno.env.get('CALENDLY_CLIENT_ID')
      const clientSecret = Deno.env.get('CALENDLY_CLIENT_SECRET')
      const redirectUri = redirect_uri || Deno.env.get('CALENDLY_REDIRECT_URI')

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

      // Get user/org info from Calendly
      const userResponse = await fetch('https://api.calendly.com/users/me', {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      })
      const userData = await userResponse.json()
      const userUri = userData.resource.uri
      const organizationUri = userData.resource.current_organization

      // Save central tokens
      const { error: dbError } = await supabaseClient
        .from('calendly_central_auth')
        .upsert({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
          provider_user_uri: userUri,
          organization_uri: organizationUri,
          updated_at: new Date().toISOString()
        })

      if (dbError) throw dbError

      return new Response(JSON.stringify({ success: true, message: 'Central account connected' }), {
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
