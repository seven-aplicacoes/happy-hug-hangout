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

  const startTimeStr = new Date().toISOString();
  console.log(`[TEAMS_SYNC_START] Function triggered at ${startTimeStr}`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const outlookApiKey = Deno.env.get('MICROSOFT_OUTLOOK_API_KEY');
    const teamsApiKey = Deno.env.get('MICROSOFT_TEAMS_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { meetingId, action: requestedAction, connector: requestedConnector } = await req.json();
    console.log(`[TEAMS_SYNC_START]`, { meetingId, action: requestedAction, connector: requestedConnector });

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ success: false, error: "LOVABLE_API_KEY missing" }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // DIAGNOSTIC ACTIONS
    if (requestedAction === 'test_calendar') {
      const connectorId = requestedConnector || 'microsoft_outlook';
      const apiKey = connectorId === 'microsoft_teams' ? teamsApiKey : outlookApiKey;
      const gatewayUrl = `https://connector-gateway.lovable.dev/${connectorId}`;
      const commonHeaders = { 'Authorization': `Bearer ${lovableApiKey}`, 'X-Connection-Api-Key': apiKey!, 'Content-Type': 'application/json' };

      const meResp = await fetch(`${gatewayUrl}/me`, { headers: commonHeaders });
      const meData = await meResp.json().catch(() => ({}));
      const calResp = await fetch(`${gatewayUrl}/me/calendar`, { headers: commonHeaders });
      const calData = await calResp.json().catch(() => ({}));
      const eventsResp = await fetch(`${gatewayUrl}/me/events?$top=1`, { headers: commonHeaders });
      const eventsData = await eventsResp.json().catch(() => ({}));
      
      const omResp = await fetch(`${gatewayUrl}/me/onlineMeetings`, { 
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({
          startDateTime: new Date().toISOString(),
          endDateTime: new Date(Date.now() + 3600000).toISOString(),
          subject: 'Test Meeting'
        })
      });
      const omData = await omResp.json().catch(() => ({}));

      return new Response(JSON.stringify({
        connector: connectorId,
        steps: [
          { name: 'GET /me', status: meResp.status, ok: meResp.ok },
          { name: 'GET /me/calendar', status: calResp.status, ok: calResp.ok },
          { name: 'GET /me/events', status: eventsResp.status, ok: eventsResp.ok },
          { name: 'POST /me/onlineMeetings', status: omResp.status, ok: omResp.ok }
        ],
        me: meData,
        calendar: calData,
        onlineMeeting: omData
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!meetingId) {
      return new Response(JSON.stringify({ success: false, error: 'Missing meetingId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select(`*, client:client_id (*), consultant:consultant_id (*)`)
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return new Response(JSON.stringify({ success: false, error: 'Meeting not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const clientEmail = meeting.client?.email;
    const clientName = meeting.client?.trade_name || meeting.client?.corporate_name || 'Cliente';
    const consultantEmail = meeting.consultant?.email;
    const consultantName = meeting.consultant?.full_name || 'Consultor';

    const timezone = meeting.timezone || 'America/Fortaleza';
    const startDateTime = `${meeting.meeting_date}T${meeting.start_time}`;
    const [hours, minutes] = meeting.start_time.split(':').map(Number);
    const endDate = new Date(meeting.meeting_date);
    endDate.setHours(hours, minutes + (meeting.duration || 60));
    const endDateTime = `${meeting.meeting_date}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;

    const action = requestedAction || (meeting.microsoft_event_id ? 'update' : 'create');
    let success = false;
    let responseData: any = {};
    let responseStatus = 0;
    let finalConnector = '';

    const connectorsToTry = requestedConnector ? [requestedConnector] : ['microsoft_outlook', 'microsoft_teams'];

    for (const connectorId of connectorsToTry) {
      const apiKey = connectorId === 'microsoft_teams' ? teamsApiKey : outlookApiKey;
      if (!apiKey) continue;

      const gatewayUrl = `https://connector-gateway.lovable.dev/${connectorId}`;
      let graphUrl = `${gatewayUrl}/me/events`;
      let method = 'POST';
      let body: any = null;

      if (action === 'create' || action === 'update') {
        method = action === 'create' ? 'POST' : 'PATCH';
        if (action === 'update' && meeting.microsoft_event_id) {
          graphUrl = `${gatewayUrl}/me/events/${meeting.microsoft_event_id}`;
        }

        body = {
          subject: meeting.title || `Reunião - ${clientName}`,
          body: { contentType: 'HTML', content: meeting.description || 'Reunião agendada pelo portal SEVEN.' },
          start: { dateTime: startDateTime, timeZone: timezone },
          end: { dateTime: endDateTime, timeZone: timezone },
          location: { displayName: 'Microsoft Teams' },
          attendees: [
            { emailAddress: { address: clientEmail, name: clientName }, type: 'required' },
            { emailAddress: { address: consultantEmail, name: consultantName }, type: 'required' }
          ],
          isOnlineMeeting: true,
          onlineMeetingProvider: 'teamsForBusiness'
        };
      } else if (action === 'cancel' || action === 'delete') {
        if (!meeting.microsoft_event_id) { success = true; break; }
        graphUrl = `${gatewayUrl}/me/events/${meeting.microsoft_event_id}/cancel`;
        method = 'POST';
        body = { comment: meeting.cancel_reason || 'Cancelado via portal.' };
      }

      console.log(`[TEAMS_SYNC] Trying ${connectorId} with teamsForBusiness...`);
      let resp = await fetch(graphUrl, {
        method,
        headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'X-Connection-Api-Key': apiKey, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });

      if (!resp.ok && action === 'create') {
        console.log(`[TEAMS_SYNC] teamsForBusiness failed (${resp.status}), trying teamsForLife...`);
        body.onlineMeetingProvider = 'teamsForLife';
        resp = await fetch(graphUrl, {
          method,
          headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'X-Connection-Api-Key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      }

      responseStatus = resp.status;
      const text = await resp.text();
      try { responseData = JSON.parse(text); } catch { responseData = { raw: text }; }

      if (resp.ok || responseStatus === 204) {
        success = true;
        finalConnector = connectorId;
        break;
      }
    }

    const updates: any = {
      microsoft_last_sync_at: new Date().toISOString(),
      microsoft_sync_status: success ? 'success' : 'error',
      microsoft_sync_error: success ? null : (responseData.error?.message || JSON.stringify(responseData)),
    };

    if (success && (action === 'create' || action === 'update')) {
      if (responseData.id) updates.microsoft_event_id = responseData.id;
      const joinUrl = responseData.onlineMeeting?.joinUrl || responseData.onlineMeetingUrl || responseData.joinUrl;
      if (joinUrl) {
        updates.teams_join_url = joinUrl;
        updates.meeting_url = joinUrl;
      }
    }

    await supabase.from('meetings').update(updates).eq('id', meetingId);

    return new Response(JSON.stringify({ success, responseData, connector: finalConnector }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error(`[TEAMS_SYNC_FATAL]`, error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})