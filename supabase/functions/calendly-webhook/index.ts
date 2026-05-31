import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import * as crypto from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, calendly-webhook-signature',
}

async function verifyCalendlySignature(rawBody: string, signatureHeader: string | null, signingKey: string | undefined): Promise<boolean> {
  if (!signatureHeader || !signingKey) {
    console.warn("Calendly signature header or signing key missing");
    return false;
  }

  try {
    const parts = signatureHeader.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));

    if (!timestampPart || !signaturePart) return false;

    const timestamp = timestampPart.split('=')[1];
    const signature = signaturePart.split('=')[1];

    const signedPayload = `${timestamp}.${rawBody}`;
    
    const hmac = crypto.createHmac('sha256', signingKey);
    hmac.update(signedPayload);
    const expectedSignature = hmac.digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error("Error verifying Calendly signature:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const rawBody = await req.text();
  const signatureHeader = req.headers.get('Calendly-Webhook-Signature');
  const signingKey = Deno.env.get('CALENDLY_WEBHOOK_SIGNING_KEY');

  if (signingKey) {
    const isValid = await verifyCalendlySignature(rawBody, signatureHeader, signingKey);
    if (!isValid) {
      console.error("Invalid Calendly signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
  }

  try {
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.payload;

    console.log(`Received Calendly webhook: ${event}`, JSON.stringify(data));

    if (event === 'invitee.created') {
      const invitee = data.invitee;
      const eventData = data.event;
      
      const tracking = data.tracking || {};
      const meetingId = tracking.utm_content;
      
      if (!meetingId) {
        console.warn('Meeting ID not found in Calendly tracking params');
        return new Response(JSON.stringify({ success: false, message: 'Meeting ID missing' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      const { data: meeting, error: meetingError } = await supabaseClient
        .from('contract_module_meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (meetingError || !meeting) {
        console.error('Error fetching internal meeting:', meetingError);
        return new Response(JSON.stringify({ success: false, error: 'Meeting not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
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
        calendly_event_uri: data.event,
        calendly_invitee_uri: data.uri,
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
      };

      await supabaseClient
        .from('meeting_scheduling_events')
        .upsert(schedulingEvent, { onConflict: 'calendly_invitee_uri' });

      // Create/Update record in 'meetings' table
      const { data: newMeetingRow, error: meetingTableError } = await supabaseClient
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
          contract_module_meeting_id: meetingId,
          cancel_url: invitee.cancel_url,
          reschedule_url: invitee.reschedule_url,
        }, { onConflict: 'external_id' })
        .select()
        .single();

      if (meetingTableError) {
        console.error('Error creating meeting record:', meetingTableError);
      }

      // Update internal meeting status
      await supabaseClient
        .from('contract_module_meetings')
        .update({
          status: 'agendado',
          scheduled_at: eventData.start_time,
          scheduled_meeting_id: newMeetingRow?.id || null,
          cancel_url: invitee.cancel_url,
          reschedule_url: invitee.reschedule_url,
        })
        .eq('id', meetingId);

    } else if (event === 'invitee.canceled') {
      const invitee = data.invitee;
      
      const { data: schedulingEvent, error: fetchError } = await supabaseClient
        .from('meeting_scheduling_events')
        .select('*')
        .eq('calendly_invitee_uri', data.uri)
        .single();

      if (fetchError || !schedulingEvent) {
        console.error('Scheduling event not found for cancellation:', fetchError);
      } else {
        const isRescheduled = invitee.rescheduled === true;
        
        await supabaseClient
          .from('meeting_scheduling_events')
          .update({
            status: isRescheduled ? 'rescheduled' : 'canceled',
            canceled_at: invitee.canceled_at || new Date().toISOString(),
            cancellation_reason: invitee.cancellation_reason,
            rescheduled: isRescheduled,
          })
          .eq('id', schedulingEvent.id);

        if (!isRescheduled) {
          await supabaseClient
            .from('contract_module_meetings')
            .update({
              status: 'pendente',
              scheduled_at: null,
              cancel_url: null,
              reschedule_url: null,
            })
            .eq('id', schedulingEvent.meeting_id);
            
          await supabaseClient
            .from('meetings')
            .update({ 
              status: 'cancelada',
              cancel_url: null,
              reschedule_url: null,
            })
            .eq('external_id', data.uri);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
