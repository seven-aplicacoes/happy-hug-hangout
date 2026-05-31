import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

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

    const payload = await req.json()
    const event = payload.event
    const data = payload.payload

    console.log(`Received Calendly webhook: ${event}`, JSON.stringify(data))

    if (event === 'invitee.created') {
      const invitee = data.invitee
      const eventData = data.event
      
      // Extract tracking params from UTMs or custom answers
      // Calendly passes UTMs in payload.tracking
      const tracking = data.tracking || {}
      
      // Use meeting_id from utm_content as suggested
      const meetingId = tracking.utm_content
      const clientId = tracking.utm_term
      
      // If we don't have meetingId from UTMs, we might have it in custom answers if configured
      // invitee.questions_and_answers is an array of {question, answer}
      
      if (!meetingId) {
        console.warn('Meeting ID not found in Calendly tracking params')
        return new Response(JSON.stringify({ success: false, message: 'Meeting ID missing' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // Return 200 to Calendly to avoid retries
        })
      }

      // Fetch internal meeting details to get contract, product, consultant context
      const { data: meeting, error: meetingError } = await supabaseClient
        .from('contract_module_meetings')
        .select('*')
        .eq('id', meetingId)
        .single()

      if (meetingError || !meeting) {
        console.error('Error fetching internal meeting:', meetingError)
        return new Response(JSON.stringify({ success: false, error: 'Meeting not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      // Create or update scheduling event
      const schedulingEvent = {
        client_id: meeting.client_id,
        contract_id: meeting.contract_id,
        product_id: meeting.product_id,
        module_id: meeting.module_id,
        meeting_id: meetingId,
        consultant_id: meeting.consultant_id,
        provider: 'calendly',
        calendly_event_uri: data.event, // link to event details
        calendly_invitee_uri: data.uri, // link to invitee details
        calendly_event_uuid: data.event.split('/').pop(),
        calendly_invitee_uuid: data.uri.split('/').pop(),
        event_name: eventData.name,
        invitee_name: invitee.name,
        invitee_email: invitee.email,
        scheduled_start_time: eventData.start_time,
        scheduled_end_time: eventData.end_time,
        timezone: invitee.timezone,
        status: 'scheduled',
        cancel_url: invitee.cancel_url,
        reschedule_url: invitee.reschedule_url,
        raw_payload: payload,
      }

      const { error: upsertError } = await supabaseClient
        .from('meeting_scheduling_events')
        .upsert(schedulingEvent, { onConflict: 'calendly_invitee_uri' })

      if (upsertError) {
        console.error('Error upserting scheduling event:', upsertError)
      }

      // Update internal meeting status
      const { error: updateError } = await supabaseClient
        .from('contract_module_meetings')
        .update({
          status: 'agendado',
          scheduled_at: eventData.start_time,
          scheduled_meeting_id: null, // We could link to a 'meetings' table row here if we wanted
        })
        .eq('id', meetingId)

      if (updateError) {
        console.error('Error updating meeting status:', updateError)
      }

      // Also create a record in 'meetings' table to show in calendars/history
      const { error: meetingTableError } = await supabaseClient
        .from('meetings')
        .upsert({
          client_id: meeting.client_id,
          contract_id: meeting.contract_id,
          consultant_id: meeting.consultant_id,
          meeting_date: eventData.start_time.split('T')[0],
          start_time: new Date(eventData.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }),
          duration: Math.round((new Date(eventData.end_time).getTime() - new Date(eventData.start_time).getTime()) / 60000),
          title: `${meeting.title} (Calendly)`,
          status: 'agendada',
          source: 'calendly',
          external_id: data.uri,
        })

      if (meetingTableError) {
        console.error('Error creating meeting record:', meetingTableError)
      }

    } else if (event === 'invitee.canceled') {
      const invitee = data.invitee
      
      // Find the scheduling event by invitee uri
      const { data: schedulingEvent, error: fetchError } = await supabaseClient
        .from('meeting_scheduling_events')
        .select('*')
        .eq('calendly_invitee_uri', data.uri)
        .single()

      if (fetchError || !schedulingEvent) {
        console.error('Scheduling event not found for cancellation:', fetchError)
      } else {
        const isRescheduled = invitee.rescheduled === true
        
        await supabaseClient
          .from('meeting_scheduling_events')
          .update({
            status: isRescheduled ? 'rescheduled' : 'canceled',
            canceled_at: invitee.canceled_at || new Date().toISOString(),
            cancellation_reason: invitee.cancellation_reason,
          })
          .eq('id', schedulingEvent.id)

        // Update internal meeting if not rescheduling (rescheduling will trigger a new created event)
        if (!isRescheduled) {
          await supabaseClient
            .from('contract_module_meetings')
            .update({
              status: 'pendente',
              scheduled_at: null,
            })
            .eq('id', schedulingEvent.meeting_id)
            
          // Update meeting table
          await supabaseClient
            .from('meetings')
            .update({ status: 'cancelada' })
            .eq('external_id', data.uri)
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
