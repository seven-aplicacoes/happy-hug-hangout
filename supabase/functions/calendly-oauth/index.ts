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

    const { action, code } = await req.json()

    if (action === 'exchange_code') {
      if (!code) throw new Error('Missing code')

      const clientId = Deno.env.get('CALENDLY_CLIENT_ID')
      const clientSecret = Deno.env.get('CALENDLY_CLIENT_SECRET')
      const redirectUri = (await req.json()).redirect_uri || Deno.env.get('CALENDLY_REDIRECT_URI')

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

      const accessToken = data.access_token

      // Get user info from Calendly
      const userResponse = await fetch('https://api.calendly.com/users/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const userData = await userResponse.json()
      const userUri = userData.resource.uri
      const schedulingUrl = userData.resource.scheduling_url

      // Fetch Event Types
      const eventTypesResponse = await fetch(`https://api.calendly.com/event_types?user=${userUri}&active=true`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const eventTypesData = await eventTypesResponse.json()
      const eventTypes = eventTypesData.collection || []

      // Save tokens to DB
      const { error: dbError } = await supabaseClient
        .from('consultant_calendar_integrations')
        .upsert({
          consultant_id: user.id,
          provider: 'calendly',
          access_token_encrypted: accessToken,
          refresh_token_encrypted: data.refresh_token,
          expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
          scope: data.scope,
          provider_user_uri: userUri,
          status: 'active',
          last_sync_at: new Date().toISOString()
        }, { onConflict: 'consultant_id, provider' })

      if (dbError) throw dbError

      // Save Event Types
      if (eventTypes.length > 0) {
        // Clear existing for this consultant to refresh
        await supabaseClient.from('consultant_calendly_event_types').delete().eq('consultant_id', user.id)

        const eventTypesToInsert = eventTypes.map((et: any, index: number) => ({
          consultant_id: user.id,
          calendly_event_type_uri: et.uri,
          calendly_scheduling_url: et.scheduling_url,
          name: et.name,
          duration: et.duration,
          active: et.active,
          is_default: index === 0 // Mark first one as default initially
        }))

        const { error: etError } = await supabaseClient
          .from('consultant_calendly_event_types')
          .insert(eventTypesToInsert)

        if (etError) console.error('Error saving event types:', etError)
      }

      // Update consultant profile with the default scheduling URL
      const defaultEt = eventTypes[0]
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({
          calendly_user_uri: userUri,
          calendly_scheduling_url: defaultEt?.scheduling_url || schedulingUrl,
          calendly_event_type_uri: defaultEt?.uri || null,
          calendly_connected: true
        })
        .eq('id', user.id)

      if (profileError) throw profileError

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