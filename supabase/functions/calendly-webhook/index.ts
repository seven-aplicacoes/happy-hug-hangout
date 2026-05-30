import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function verifySignature(signature: string, body: string, signingKey: string) {
  const parts = signature.split(',')
  const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1]
  const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1]

  if (!timestamp || !v1) return false

  const signedPayload = `${timestamp}.${body}`
  
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload)
  )

  const expectedSignature = Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return expectedSignature === v1
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

    const signature = req.headers.get('calendly-webhook-signature')
    const signingKey = Deno.env.get('CALENDLY_WEBHOOK_SIGNING_KEY')
    const bodyText = await req.text()

    if (signature && signingKey) {
      const isValid = await verifySignature(signature, bodyText, signingKey)
      if (!isValid) {
        console.error('Invalid Calendly signature')
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })
      }
    }

    const payload = JSON.parse(bodyText)
    const event = payload.event
    const data = payload.payload

    console.log(`Calendly Webhook Event: ${event}`)

    if (event === 'invitee.created') {
      const eventUri = data.event
      const inviteeUri = data.uri
      const tracking = data.tracking || {}
      const sessionToken = tracking.utm_term || tracking.salesforce_uuid
      
      console.log(`Processing booking. Session: ${sessionToken}`)

      const { data: session, error: sessionError } = await supabaseClient
        .from('calendly_booking_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('status', 'pending')
        .single()

      if (sessionError || !session) {
        console.warn('Session not found or already completed:', sessionToken)
        return new Response(JSON.stringify({ success: true, message: 'Session already handled or not found' }))
      }

      const accessToken = await getValidToken(supabaseClient)

      const eventDetailsResponse = await fetch(eventUri, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const eventDetails = await eventDetailsResponse.json()
      
      if (!eventDetails.resource) {
        throw new Error('Could not fetch event details from Calendly')
      }

      const startTime = eventDetails.resource.start_time
      const endTime = eventDetails.resource.end_time
      
      const startDateTime = new Date(startTime)
      const datePart = startDateTime.toISOString().split('T')[0]
      const timePart = startDateTime.toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit' })
      const duration = (new Date(endTime).getTime() - startDateTime.getTime()) / (1000 * 60)

      // Create meeting
      const { data: meeting, error: meetingError } = await supabaseClient
        .from('meetings')
        .insert({
          client_id: session.client_id,
          contract_id: session.contract_id,
          consultant_id: session.consultant_id,
          contract_module_meeting_id: session.contract_module_meeting_id,
          title: `Reunião Calendly: ${eventDetails.resource.name}`,
          status: 'agendada',
          meeting_date: datePart,
          start_time: timePart,
          duration: Math.round(duration),
          source: 'calendly',
          external_provider: 'calendly',
          external_event_uri: eventUri,
          external_invitee_uri: inviteeUri,
          external_event_type_uri: session.calendly_event_type_uri,
          external_cancel_url: data.cancel_url,
          external_reschedule_url: data.reschedule_url,
          external_payload: data
        })
        .select()
        .single()

      if (meetingError) throw meetingError

      // Update meeting status in module
      await supabaseClient
        .from('contract_module_meetings')
        .update({
          status: 'agendado',
          scheduled_meeting_id: meeting.id,
          scheduled_at: startTime
        })
        .eq('id', session.contract_module_meeting_id)

      // Mark session as completed
      await supabaseClient
        .from('calendly_booking_sessions')
        .update({ status: 'completed' })
        .eq('id', session.id)

      // Timeline event
      await supabaseClient
        .from('timeline_events')
        .insert({
          client_id: session.client_id,
          type: 'reuniao',
          title: 'Encontro Agendado',
          description: `O encontro foi agendado via Calendly para ${datePart} às ${timePart}.`,
          date: new Date().toISOString()
        })

      console.log('Successfully processed invitee.created')
    }

    if (event === 'invitee.canceled') {
      const inviteeUri = data.uri
      console.log(`Processing cancellation: ${inviteeUri}`)
      
      const { data: meeting, error: findError } = await supabaseClient
        .from('meetings')
        .select('*')
        .eq('external_invitee_uri', inviteeUri)
        .single()

      if (!findError && meeting) {
        await supabaseClient
          .from('meetings')
          .update({ 
            status: 'cancelada',
            external_payload: { ...meeting.external_payload, cancellation: data }
          })
          .eq('id', meeting.id)

        await supabaseClient
          .from('contract_module_meetings')
          .update({
            status: 'liberado',
            scheduled_meeting_id: null,
            scheduled_at: null
          })
          .eq('id', meeting.contract_module_meeting_id)

        console.log('Successfully processed invitee.canceled')
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
