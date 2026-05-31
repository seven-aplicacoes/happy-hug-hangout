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
    const { meeting_id, invitee_uri, event_uri, invitee_email } = await req.json()
    const token = Deno.env.get('CALENDLY_PERSONAL_ACCESS_TOKEN')

    if (!token) {
      return new Response(JSON.stringify({ error: 'CALENDLY_PERSONAL_ACCESS_TOKEN not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Syncing Calendly event for meeting ${meeting_id}. URI: ${invitee_uri || event_uri || invitee_email}`)

    // If we have an invitee_uri, fetch details from Calendly API
    let inviteeData = null
    let eventData = null

    if (invitee_uri) {
      const resp = await fetch(invitee_uri, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (resp.ok) {
        const json = await resp.json()
        inviteeData = json.resource
        
        // Fetch event data too
        if (inviteeData.event) {
          const evResp = await fetch(inviteeData.event, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (evResp.ok) {
            const evJson = await evResp.json()
            eventData = evJson.resource
          }
        }
      }
    }

    if (!inviteeData || !eventData) {
      // Fallback: search for recent invitees if email provided
      // This is more complex, for now we assume we got the URI from the frontend listener
      return new Response(JSON.stringify({ error: 'Could not fetch data from Calendly' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // Now update Supabase just like the webhook would
    // 1. Fetch meeting
    const { data: meeting } = await supabaseClient
      .from('contract_module_meetings')
      .select('*')
      .eq('id', meeting_id)
      .single()

    if (meeting) {
      // 2. Upsert Scheduling Event
      const schedulingEvent = {
        client_id: meeting.client_id,
        contract_id: meeting.contract_id,
        product_id: meeting.product_id,
        module_id: meeting.module_id,
        meeting_id: meeting_id,
        consultant_id: meeting.consultant_id,
        provider: 'calendly',
        calendly_event_uri: inviteeData.event,
        calendly_invitee_uri: invitee_uri,
        event_name: eventData.name,
        invitee_name: inviteeData.name,
        invitee_email: inviteeData.email,
        scheduled_start_time: eventData.start_time,
        scheduled_end_time: eventData.end_time,
        timezone: inviteeData.timezone,
        status: inviteeData.status || 'scheduled',
        cancel_url: inviteeData.cancel_url,
        reschedule_url: inviteeData.reschedule_url,
        updated_at: new Date().toISOString()
      }

      await supabaseClient
        .from('meeting_scheduling_events')
        .upsert(schedulingEvent, { onConflict: 'calendly_invitee_uri' })

      // 3. Update meeting
      if (inviteeData.status !== 'canceled') {
        await supabaseClient
          .from('contract_module_meetings')
          .update({
            status: 'agendado',
            scheduled_at: eventData.start_time,
            cancel_url: inviteeData.cancel_url,
            reschedule_url: inviteeData.reschedule_url,
          })
          .eq('id', meeting_id)
      }
    }

    return new Response(JSON.stringify({ success: true, data: { invitee: inviteeData, event: eventData } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})