import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function verifySignature(signature: string, body: string, signingKey: string) {
  // Calendly signature format: t=<timestamp>,v1=<signature>
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
    } else {
      console.warn('Webhook received without signature validation (check signing key)')
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
        return new Response(JSON.stringify({ success: true, message: 'Session handled' }))
      }

      const { data: integration } = await supabaseClient
        .from('consultant_calendar_integrations')
        .select('access_token_encrypted')
        .eq('consultant_id', session.consultant_id)
        .single()

      if (!integration) throw new Error('Consultant integration missing')

      const eventDetailsResponse = await fetch(eventUri, {
        headers: { 'Authorization': `Bearer ${integration.access_token_encrypted}` }
      })
      const eventDetails = await eventDetailsResponse.json()
      const startTime = eventDetails.resource.start_time
      const endTime = eventDetails.resource.end_time
      
      const startDateTime = new Date(startTime)
      const datePart = startDateTime.toISOString().split('T')[0]
      const timePart = startDateTime.toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit' })
      const duration = (new Date(endTime).getTime() - startDateTime.getTime()) / (1000 * 60)

      const { data: meeting, error: meetingError } = await supabaseClient
        .from('meetings')
        .insert({
          client_id: session.client_id,
          contract_id: session.contract_id,
          contract_product_id: session.contract_product_id,
          contract_product_phase_id: session.contract_phase_id,
          contract_module_meeting_id: session.contract_module_meeting_id,
          consultant_id: session.consultant_id,
          title: `Reunião Calendly: ${eventDetails.resource.name}`,
          status: 'agendada',
          meeting_date: datePart,
          start_time: timePart,
          duration: Math.round(duration),
          source: 'calendly',
          external_provider: 'calendly',
          calendly_event_uri: eventUri,
          calendly_invitee_uri: inviteeUri,
          calendly_cancel_url: data.cancel_url,
          calendly_reschedule_url: data.reschedule_url,
          external_payload: data
        })
        .select()
        .single()

      if (meetingError) throw meetingError

      await supabaseClient
        .from('contract_module_meetings')
        .update({
          status: 'agendado',
          scheduled_meeting_id: meeting.id,
          scheduled_at: startTime,
          consultant_id: session.consultant_id
        })
        .eq('id', session.contract_module_meeting_id)

      await supabaseClient
        .from('calendly_booking_sessions')
        .update({ status: 'completed' })
        .eq('id', session.id)

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
        .eq('calendly_invitee_uri', inviteeUri)
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