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
      console.warn('CALENDLY_PERSONAL_ACCESS_TOKEN not configured');
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
      } else {
        console.error(`Error fetching invitee from Calendly: ${resp.status} ${resp.statusText}`);
      }
    }

    if (!inviteeData || !eventData) {
      return new Response(JSON.stringify({ error: 'Could not fetch data from Calendly' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // Now update Supabase just like the webhook would
    // 1. Fetch meeting
    const { data: meeting } = await supabaseClient
      .from('contract_module_meetings')
      .select(`
        *,
        consultant:profiles!consultant_id (full_name)
      `)
      .eq('id', meeting_id)
      .single()

    if (meeting) {
      const isCanceled = inviteeData.status === 'canceled';
      
      // Before UPSERT, if it's NOT a cancel, mark others as superseded
      if (!isCanceled) {
        await supabaseClient
          .from('meeting_scheduling_events')
          .update({ status: 'superseded', updated_at: new Date().toISOString() })
          .eq('meeting_id', meeting_id)
          .eq('status', 'scheduled');
      }

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
        raw_payload: { invitee: inviteeData, event: eventData },
        updated_at: new Date().toISOString()
      }

      const { data: insertedEvent } = await supabaseClient
        .from('meeting_scheduling_events')
        .upsert(schedulingEvent, { onConflict: 'calendly_invitee_uri' })
        .select()
        .single()

      // 3. Create History Entry
      await supabaseClient
        .from('meeting_history_events')
        .insert({
          meeting_id: meeting_id,
          scheduling_event_id: insertedEvent?.id,
          client_id: meeting.client_id,
          consultant_id: meeting.consultant_id,
          event_type: isCanceled ? 'canceled' : 'scheduled',
          title: isCanceled ? 'Encontro cancelado (Sinc)' : 'Encontro agendado (Sinc)',
          description: isCanceled 
            ? `Cancelamento sincronizado manualmente.` 
            : `Agendamento sincronizado manualmente com ${meeting.consultant?.full_name || 'consultor'} para ${new Date(eventData.start_time).toLocaleString('pt-BR')}.`,
          new_start_time: isCanceled ? null : eventData.start_time,
          previous_start_time: isCanceled ? eventData.start_time : null,
          metadata: { sync_source: 'manual_fallback', invitee_uri }
        });

      // 4. Update meeting core status
      if (!isCanceled) {
        await supabaseClient
          .from('contract_module_meetings')
          .update({
            status: 'agendado',
            scheduled_at: eventData.start_time,
            cancel_url: inviteeData.cancel_url,
            reschedule_url: inviteeData.reschedule_url,
          })
          .eq('id', meeting_id)
      } else {
        await supabaseClient
          .from('contract_module_meetings')
          .update({
            status: 'pendente',
            scheduled_at: null,
            cancel_url: null,
            reschedule_url: null,
          })
          .eq('id', meeting_id)
      }
    }

    return new Response(JSON.stringify({ success: true, data: { invitee: inviteeData, event: eventData } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})