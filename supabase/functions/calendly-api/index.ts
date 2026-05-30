import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getValidToken(supabaseClient: any) {
  const { data: auth, error } = await supabaseClient
    .from('calendly_central_auth')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !auth) throw new Error('Calendly central account not connected')

  const expiresAt = new Date(auth.expires_at)
  if (expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
    return auth.access_token
  }

  // Refresh token
  const clientId = Deno.env.get('CALENDLY_CLIENT_ID')
  const clientSecret = Deno.env.get('CALENDLY_CLIENT_SECRET')

  const response = await fetch('https://auth.calendly.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: auth.refresh_token,
    })
  })

  const data = await response.json()
  if (!response.ok) throw new Error('Failed to refresh Calendly token')

  await supabaseClient
    .from('calendly_central_auth')
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', auth.id)

  return data.access_token
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

    const { action, ...params } = await req.json()

    if (action === 'get_event_types') {
      const accessToken = await getValidToken(supabaseClient)
      const { data: auth } = await supabaseClient.from('calendly_central_auth').select('organization_uri').limit(1).single()
      
      const response = await fetch(`https://api.calendly.com/event_types?organization=${auth.organization_uri}&active=true`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'get_booking_url') {
      const { meetingId } = params
      if (!meetingId) throw new Error('Missing meetingId')

      // Fetch meeting context
      const { data: meeting, error: meetingError } = await supabaseClient
        .from('contract_module_meetings')
        .select(`
          id,
          module_id,
          consultant_id,
          module:contract_methodology_modules(
            contract_id,
            contract:contracts(client_id)
          )
        `)
        .eq('id', meetingId)
        .single()

      if (meetingError || !meeting) throw new Error('Meeting not found')

      const consultantId = meeting.consultant_id
      const clientId = meeting.module.contract.client_id
      const contractId = meeting.module.contract_id

      // Find consultant's Calendly setting
      const { data: setting, error: settingError } = await supabaseClient
        .from('consultant_calendly_settings')
        .select('*')
        .eq('consultant_id', consultantId)
        .single()

      if (settingError || !setting) throw new Error('Consultant does not have a Calendly link configured')

      // Create a booking session
      const sessionToken = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h

      const { error: sessionError } = await supabaseClient
        .from('calendly_booking_sessions')
        .insert({
          session_token: sessionToken,
          client_id: clientId,
          contract_id: contractId,
          contract_module_meeting_id: meetingId,
          consultant_id: consultantId,
          calendly_event_type_uri: setting.calendly_event_type_uri,
          expires_at: expiresAt
        })

      if (sessionError) throw sessionError

      // Pre-fill client info if possible
      const { data: client } = await supabaseClient.from('clients').select('name, email').eq('id', clientId).single()

      const url = new URL(setting.calendly_scheduling_url)
      if (client?.name) url.searchParams.set('name', client.name)
      if (client?.email) url.searchParams.set('email', client.email)
      
      // Use utm_term to store the session token for the webhook
      url.searchParams.set('utm_term', sessionToken)

      return new Response(JSON.stringify({ url: url.toString() }), {
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
