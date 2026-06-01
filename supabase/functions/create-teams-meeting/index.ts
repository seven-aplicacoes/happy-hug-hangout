import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// O connector_id pode ser microsoft_outlook ou microsoft_teams
let CONNECTOR_ID = 'microsoft_outlook'
let GATEWAY_URL = `https://connector-gateway.lovable.dev/${CONNECTOR_ID}`

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

    if (requestedConnector) {
      CONNECTOR_ID = requestedConnector;
      GATEWAY_URL = `https://connector-gateway.lovable.dev/${CONNECTOR_ID}`;
    }

    const currentApiKey = CONNECTOR_ID === 'microsoft_teams' ? teamsApiKey : outlookApiKey;

    if (!lovableApiKey || !currentApiKey) {
      console.error('[TEAMS_SYNC_ERROR] Missing API keys', { lovableApiKey: !!lovableApiKey, currentApiKey: !!currentApiKey, connector: CONNECTOR_ID });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error_code: 'MICROSOFT_TOKEN_MISSING',
          message: 'Conector Microsoft Outlook não configurado corretamente.',
          details: 'Verifique se o conector Microsoft Outlook está ativo e conectado no Lovable.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const commonHeaders = {
      'Authorization': `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': currentApiKey!,
      'Content-Type': 'application/json',
    };

    // DIAGNOSTIC ACTIONS
    if (requestedAction === 'test_connection') {
      console.log("[TEAMS_SYNC_DIAGNOSTIC] Testing connection...");
      const meResponse = await fetch(`${GATEWAY_URL}/me`, { headers: commonHeaders });
      const meData = await meResponse.text();
      
      return new Response(JSON.stringify({ 
        success: meResponse.ok,
        status: meResponse.status,
        connector: CONNECTOR_ID,
        endpoint: '/me',
        details: meData
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (requestedAction === 'test_calendar') {
      console.log("[TEAMS_SYNC_DIAGNOSTIC] Testing calendar permissions...");
      
      // 1. Check /me
      const meResp = await fetch(`${GATEWAY_URL}/me`, { headers: commonHeaders });
      const meData = await meResp.json().catch(() => ({}));
      
      // 2. Check /me/calendar
      const calResp = await fetch(`${GATEWAY_URL}/me/calendar`, { headers: commonHeaders });
      const calData = await calResp.json().catch(() => ({}));
      
      // 3. Try to list events (top 1)
      const eventsResp = await fetch(`${GATEWAY_URL}/me/events?$top=1`, { headers: commonHeaders });
      const eventsData = await eventsResp.json().catch(() => ({}));

      // 4. Check /me/onlineMeetings
      const omResp = await fetch(`${GATEWAY_URL}/me/onlineMeetings`, { 
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
        success: eventsResp.ok || omResp.ok,
        status: eventsResp.status,
        connector: CONNECTOR_ID,
        steps: [
          { name: 'GET /me', status: meResp.status, ok: meResp.ok },
          { name: 'GET /me/calendar', status: calResp.status, ok: calResp.ok },
          { name: 'GET /me/events', status: eventsResp.status, ok: eventsResp.ok },
          { name: 'POST /me/onlineMeetings', status: omResp.status, ok: omResp.ok }
        ],
        me: meData,
        calendar: calData,
        onlineMeeting: omData,
        error_details: (eventsResp.status === 403 || omResp.status === 403) ? "Falta permissão Calendars.ReadWrite ou OnlineMeetings.ReadWrite" : null
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!meetingId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error_code: 'MISSING_MEETING_ID',
        message: 'ID da reunião não fornecido.' 
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch meeting data
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select(`
        *,
        client:client_id (trade_name, corporate_name, email),
        consultant:consultant_id (full_name, email)
      `)
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return new Response(JSON.stringify({ 
        success: false, 
        error_code: 'MEETING_NOT_FOUND',
        message: 'A reunião solicitada não existe.' 
      }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const clientEmail = meeting.client?.email;
    const clientName = meeting.client?.trade_name || meeting.client?.corporate_name;
    const consultantEmail = meeting.consultant?.email;
    const consultantName = meeting.consultant?.full_name;

    if (!clientEmail || !consultantEmail) {
      return new Response(JSON.stringify({ 
        success: false, 
        error_code: "EMAIL_MISSING",
        message: "E-mail do cliente ou consultor ausente." 
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build Payload
    const timezone = meeting.timezone || 'America/Fortaleza';
    const startDateTime = `${meeting.meeting_date}T${meeting.start_time}`;
    const [hours, minutes] = meeting.start_time.split(':').map(Number);
    const endDate = new Date(meeting.meeting_date);
    endDate.setHours(hours, minutes + (meeting.duration || 60));
    const endDateTime = `${meeting.meeting_date}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;

    const action = requestedAction || (meeting.microsoft_event_id ? 'update' : 'create');
    let method = action === 'create' ? 'POST' : 'PATCH';
    let body: any = null;
    let success = false;
    let responseData: any = {};
    let responseStatus = 0;
    let responseText = '';

    // Tentamos primeiro com o conector atual (default: outlook)
    // Se falhar com 403, tentamos com o outro (teams)
    const connectorsToTry = requestedConnector ? [requestedConnector] : ['microsoft_outlook', 'microsoft_teams'];

    for (const connectorId of connectorsToTry) {
      const apiKey = connectorId === 'microsoft_teams' ? teamsApiKey : outlookApiKey;
      if (!apiKey) continue;

      const gatewayUrl = `https://connector-gateway.lovable.dev/${connectorId}`;
      let graphUrl = `${gatewayUrl}/me/events`;
      
      if (action === 'create' || action === 'update') {
        method = action === 'create' ? 'POST' : 'PATCH';
        if (action === 'update' && meeting.microsoft_event_id) {
          graphUrl = `${gatewayUrl}/me/events/${meeting.microsoft_event_id}`;
        }

        body = {
          subject: meeting.title || `Reunião - ${clientName}`,
          body: {
            contentType: 'HTML',
            content: meeting.description || meeting.agenda || 'Reunião agendada pelo portal SEVEN.'
          },
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
        if (!meeting.microsoft_event_id) {
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }
        graphUrl = `${gatewayUrl}/me/events/${meeting.microsoft_event_id}/cancel`;
        method = 'POST';
        body = { comment: meeting.cancel_reason || 'Cancelado via portal.' };
      }

      console.log(`[TEAMS_SYNC] Trying connector ${connectorId}...`);
      const graphResponse = await fetch(graphUrl, {
        method,
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'X-Connection-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined
      });

      responseStatus = graphResponse.status;
      responseText = await graphResponse.text();
      try { responseData = JSON.parse(responseText); } catch (e) { responseData = { raw: responseText }; }

      if (graphResponse.ok || responseStatus === 204) {
        success = true;
        CONNECTOR_ID = connectorId; // Guardamos o que funcionou
        break;
      }

      console.warn(`[TEAMS_SYNC] Connector ${connectorId} failed with status ${responseStatus}`);
      if (responseStatus !== 403 && responseStatus !== 401) {
        // Se for um erro real (não permissão), não adianta tentar outro? 
        // Na verdade, 400 pode ser payload, mas vamos tentar o outro de qualquer forma se não for sucesso.
      }
    }

    const updates: any = {
      microsoft_last_sync_at: new Date().toISOString(),
      microsoft_sync_status: success ? 'success' : 'error',
      microsoft_sync_error: success ? null : (responseData.error?.message || responseText || 'Erro desconhecido'),
    };

    if (success) {
      if (action === 'create' || action === 'update') {
        if (responseData.id) updates.microsoft_event_id = responseData.id;
        const joinUrl = responseData.onlineMeeting?.joinUrl || responseData.onlineMeetingUrl || responseData.joinUrl || responseData.joinWebUrl;
        if (joinUrl) {
          updates.teams_join_url = joinUrl;
          updates.meeting_url = joinUrl;
          updates.location_url = joinUrl;
        }
      }
    }

    if (meetingId) {
      await supabase.from('meetings').update(updates).eq('id', meetingId);
    }

    if (success) {
      return new Response(JSON.stringify({ success: true, teamsJoinUrl: updates.teams_join_url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else {
      if (responseStatus === 403) {
        return new Response(JSON.stringify({
          success: false,
          error_code: "MICROSOFT_PERMISSION_DENIED",
          message: "A conta Microsoft conectada não possui permissão para criar eventos no calendário.",
          details: "É necessário conectar o Microsoft Outlook com a permissão Calendars.ReadWrite ativa.",
          connector: CONNECTOR_ID,
          status: 403
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 });
      }

      return new Response(JSON.stringify({ 
        success: false, 
        error_code: "MICROSOFT_GRAPH_ERROR",
        message: responseData.error?.message || 'Erro na sincronização.',
        details: responseData,
        status: responseStatus
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: responseStatus });
    }

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
})
