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

    const signature = req.headers.get('calendly-webhook-signature')
    const signingKey = Deno.env.get('CALENDLY_WEBHOOK_SIGNING_KEY')
    const bodyText = await req.text()

    // Signature verification would go here (omitted for brevity but recommended for production)

    const payload = JSON.parse(bodyText)
    const event = payload.event
    const data = payload.payload

    console.log(`Processing Calendly Event: ${event}`)

    if (event === 'invitee.created') {
      const eventUri = data.event
      const inviteeUri = data.uri
      const tracking = data.tracking || {}
      const sessionToken = tracking.utm_term || tracking.salesforce_uuid // We'll pass session_token here
      
      console.log(`Invite created. Session Token: ${sessionToken}`)

      // 1. Find the session
      const { data: session, error: sessionError } = await supabaseClient
        .from('calendly_booking_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('status', 'pending')
        .single()

      if (sessionError || !session) {
        console.error('Session not found or already processed:', sessionError)
        return new Response(JSON.stringify({ error: 'Session not found' }), { status: 200 })
      }

      // 2. Fetch event details to get date/time
      // We need consultant's access token
      const { data: integration } = await supabaseClient
        .from('consultant_calendar_integrations')
        .select('access_token_encrypted')
        .eq('consultant_id', session.consultant_id)
        .single()

      if (!integration) throw new Error('Consultant integration not found')

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

      // 3. Create the meeting
      const { data: meeting, error: meetingError } = await supabaseClient
        .from('meetings')
        .insert({
          client_id: session.client_id,
          contract_id: session.contract_id,
          contract_product_id: session.contract_product_id,
          contract_product_phase_id: session.contract_phase_id,
          contract_module_meeting_id: session.contract_module_meeting_id,
          consultant_id: session.consultant_id,
          title: `Reunião Calendly - ${eventDetails.resource.name}`,
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

      // 4. Update the encounter (contract_module_meetings)
      await supabaseClient
        .from('contract_module_meetings')
        .update({
          status: 'agendado',
          scheduled_meeting_id: meeting.id,
          scheduled_at: startTime,
          consultant_id: session.consultant_id
        })
        .eq('id', session.contract_module_meeting_id)

      // 5. Update session
      await supabaseClient
        .from('calendly_booking_sessions')
        .update({ status: 'completed' })
        .eq('id', session.id)

      console.log('Meeting created and encounter updated successfully')
    }

    if (event === 'invitee.canceled') {
      const inviteeUri = data.uri
      
      // 1. Find the meeting
      const { data: meeting, error: findError } = await supabaseClient
        .from('meetings')
        .select('*')
        .eq('calendly_invitee_uri', inviteeUri)
        .single()

      if (findError || !meeting) {
        console.error('Meeting not found for cancellation:', findError)
        return new Response(JSON.stringify({ success: true }))
      }

      // 2. Update meeting
      await supabaseClient
        .from('meetings')
        .update({ 
          status: 'cancelada',
          external_payload: { ...meeting.external_payload, cancellation: data }
        })
        .eq('id', meeting.id)

      // 3. Update encounter
      await supabaseClient
        .from('contract_module_meetings')
        .update({
          status: 'liberado', // Back to released so they can book again
          scheduled_meeting_id: null,
          scheduled_at: null
        })
        .eq('id', meeting.contract_module_meeting_id)

      console.log('Meeting canceled successfully')
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})