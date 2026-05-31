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
    const eventType = payload.event;
    const data = payload.payload;

    console.log(`Received Calendly webhook: ${eventType}`, JSON.stringify(data));

    if (eventType === 'invitee.created') {
      const invitee = data.invitee || data;
      const eventData = data.event || {};
      
      const tracking = data.tracking || {};
      const meetingId = tracking.utm_content || data.seven_meeting_id;
      const clientId = tracking.utm_term || data.seven_client_id;
      
      if (!meetingId) {
        console.warn('Meeting ID not found in Calendly payload');
        return new Response(JSON.stringify({ success: false, message: 'Meeting ID missing' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // Fetch meeting context
      const { data: meeting, error: meetingError } = await supabaseClient
        .from('contract_module_meetings')
        .select(`
          *,
          consultant:profiles!consultant_id (full_name)
        `)
        .eq('id', meetingId)
        .single();

      if (meetingError || !meeting) {
        console.error('Error fetching internal meeting:', meetingError);
        return new Response(JSON.stringify({ success: false, error: 'Meeting not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      const isReschedule = !!data.old_invitee;

      // 1. Upsert Scheduling Event
      const schedulingEvent = {
        client_id: clientId || meeting.client_id,
        contract_id: meeting.contract_id,
        product_id: meeting.product_id,
        module_id: meeting.module_id,
        meeting_id: meetingId,
        consultant_id: meeting.consultant_id,
        provider: 'calendly',
        calendly_event_uri: data.event,
        calendly_invitee_uri: data.uri,
        event_name: eventData.name,
        invitee_name: invitee.name,
        invitee_email: invitee.email,
        scheduled_start_time: eventData.start_time,
        scheduled_end_time: eventData.end_time,
        timezone: invitee.timezone,
        status: 'scheduled',
        cancel_url: invitee.cancel_url,
        reschedule_url: invitee.reschedule_url,
        rescheduled: isReschedule,
        previous_event_uri: data.old_invitee || null,
        raw_payload: payload,
        updated_at: new Date().toISOString()
      };

      const { data: insertedEvent, error: upsertError } = await supabaseClient
        .from('meeting_scheduling_events')
        .upsert(schedulingEvent, { onConflict: 'calendly_invitee_uri' })
        .select()
        .single();

      if (upsertError) console.error('Error upserting scheduling event:', upsertError);

      // 2. Create Meeting History Event
      await supabaseClient
        .from('meeting_history_events')
        .insert({
          meeting_id: meetingId,
          scheduling_event_id: insertedEvent?.id,
          client_id: clientId || meeting.client_id,
          consultant_id: meeting.consultant_id,
          event_type: isReschedule ? 'rescheduled' : 'scheduled',
          title: isReschedule ? 'Encontro remarcado' : 'Encontro agendado',
          description: isReschedule 
            ? `Reunião reagendada via Calendly para ${new Date(eventData.start_time).toLocaleString('pt-BR')}.`
            : `Reunião agendada via Calendly com ${meeting.consultant?.full_name || 'consultor'} para ${new Date(eventData.start_time).toLocaleString('pt-BR')}.`,
          new_start_time: eventData.start_time,
          metadata: { calendly_event_uri: data.event, is_reschedule: isReschedule }
        });

      // 3. Update core meeting status in contract_module_meetings
      await supabaseClient
        .from('contract_module_meetings')
        .update({
          status: 'agendado',
          scheduled_at: eventData.start_time,
          cancel_url: invitee.cancel_url,
          reschedule_url: invitee.reschedule_url,
        })
        .eq('id', meetingId);

      // 4. Update the 'meetings' table (legacy support or extra visibility)
      await supabaseClient
        .from('meetings')
        .upsert({
          client_id: clientId || meeting.client_id,
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
        }, { onConflict: 'external_id' });

    } else if (eventType === 'invitee.canceled') {
      const invitee = data.invitee || data;
      
      const { data: schedulingEvent, error: fetchError } = await supabaseClient
        .from('meeting_scheduling_events')
        .select('*')
        .eq('calendly_invitee_uri', data.uri)
        .single();

      if (fetchError || !schedulingEvent) {
        console.warn('Scheduling event not found for cancellation:', data.uri);
      } else {
        const isRescheduled = invitee.rescheduled === true;
        
        // 1. Update Scheduling Event
        await supabaseClient
          .from('meeting_scheduling_events')
          .update({
            status: isRescheduled ? 'rescheduled' : 'canceled',
            canceled_at: invitee.canceled_at || new Date().toISOString(),
            cancellation_reason: invitee.cancellation_reason,
            rescheduled: isRescheduled,
            updated_at: new Date().toISOString()
          })
          .eq('id', schedulingEvent.id);

        // 2. Create History Entry
        await supabaseClient
          .from('meeting_history_events')
          .insert({
            meeting_id: schedulingEvent.meeting_id,
            scheduling_event_id: schedulingEvent.id,
            client_id: schedulingEvent.client_id,
            consultant_id: schedulingEvent.consultant_id,
            event_type: isRescheduled ? 'rescheduled' : 'canceled',
            title: isRescheduled ? 'Encontro sendo remarcado' : 'Encontro cancelado',
            description: isRescheduled 
              ? `Processo de remarcação iniciado no Calendly.` 
              : `Agendamento cancelado no Calendly. Motivo: ${invitee.cancellation_reason || 'Não informado'}.`,
            previous_start_time: schedulingEvent.scheduled_start_time,
            metadata: { canceled_at: invitee.canceled_at, is_rescheduled: isRescheduled }
          });

        if (!isRescheduled) {
          // 3. Reset internal meeting only if NOT a reschedule (real cancel)
          await supabaseClient
            .from('contract_module_meetings')
            .update({
              status: 'pendente',
              scheduled_at: null,
              cancel_url: null,
              reschedule_url: null,
            })
            .eq('id', schedulingEvent.meeting_id);
            
          // 4. Update 'meetings' row
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