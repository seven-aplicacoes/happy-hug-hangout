import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/microsoft_teams'

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
    const teamsApiKey = Deno.env.get('MICROSOFT_TEAMS_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { meetingId, action: requestedAction } = await req.json();
    console.log(`[TEAMS_SYNC_START]`, { meetingId, action: requestedAction });

    if (!lovableApiKey || !teamsApiKey) {
      console.error('[TEAMS_SYNC_ERROR] Missing API keys');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error_code: 'MICROSOFT_TOKEN_MISSING',
          message: 'Conector Microsoft não configurado corretamente. Verifique se o conector Microsoft Teams está ativo nas configurações do Lovable.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // DIAGNOSTIC ACTION
    if (requestedAction === 'test_connection') {
      console.log("[TEAMS_SYNC_DIAGNOSTIC] Testing connection...");
      const testHeaders = {
        'Authorization': `Bearer ${lovableApiKey}`,
        'X-Connection-Api-Key': teamsApiKey,
      };
      
      const meResponse = await fetch(`${GATEWAY_URL}/me`, { headers: testHeaders });
      const meData = await meResponse.text();
      console.log("[TEAMS_SYNC_DIAGNOSTIC] GET /me status:", meResponse.status);
      
      return new Response(JSON.stringify({ 
        success: meResponse.ok,
        status: meResponse.status,
        details: meData
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!meetingId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error_code: 'MISSING_MEETING_ID',
        message: 'ID da reunião não fornecido.' 
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 1. Fetch meeting data
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
      console.error('[TEAMS_SYNC_ERROR] Meeting not found:', meetingError);
      return new Response(JSON.stringify({ 
        success: false, 
        error_code: 'MEETING_NOT_FOUND',
        message: 'A reunião solicitada não existe no banco de dados.' 
      }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log("[TEAMS_SYNC_MEETING_FOUND]", {
      meetingId,
      status: meeting.status,
      startTime: meeting.start_time,
      endTime: meeting.end_time,
      clientId: meeting.client_id,
      consultantId: meeting.consultant_id,
      existingEventId: meeting.microsoft_event_id,
      existingTeamsUrl: meeting.teams_join_url
    });

    const clientEmail = meeting.client?.email;
    const clientName = meeting.client?.trade_name || meeting.client?.corporate_name;
    const consultantEmail = meeting.consultant?.email;
    const consultantName = meeting.consultant?.full_name;

    console.log("[TEAMS_SYNC_CLIENT]", { clientId: meeting.client_id, clientName, hasClientEmail: !!clientEmail });
    console.log("[TEAMS_SYNC_CONSULTANT]", { consultantId: meeting.consultant_id, consultantName, hasConsultantEmail: !!consultantEmail });

    if (!clientEmail) {
      return new Response(JSON.stringify({ 
        success: false, 
        error_code: "CLIENT_EMAIL_MISSING",
        message: "O cliente não possui e-mail cadastrado." 
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!consultantEmail) {
      return new Response(JSON.stringify({ 
        success: false, 
        error_code: "CONSULTANT_EMAIL_MISSING",
        message: "O consultor responsável não possui e-mail cadastrado." 
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!meeting.meeting_date || !meeting.start_time) {
       return new Response(JSON.stringify({ 
        success: false, 
        error_code: "INVALID_START_END_TIME",
        message: "A reunião precisa de data e hora de início." 
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build Payload
    const timezone = meeting.timezone || 'America/Fortaleza';
    const startDateTime = `${meeting.meeting_date}T${meeting.start_time}`;
    
    // End time calculation
    const [hours, minutes] = meeting.start_time.split(':').map(Number);
    const endDate = new Date(meeting.meeting_date);
    endDate.setHours(hours, minutes + (meeting.duration || 60));
    const endDateTime = `${meeting.meeting_date}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;

    const attendees = [
      { emailAddress: { address: clientEmail, name: clientName }, type: 'required' },
      { emailAddress: { address: consultantEmail, name: consultantName }, type: 'required' }
    ];

    const action = requestedAction || (meeting.microsoft_event_id ? 'update' : 'create');
    let graphUrl = `${GATEWAY_URL}/me/events`;
    let method = 'POST';
    let body: any = null;

    if (action === 'create' || action === 'update') {
      method = action === 'create' ? 'POST' : 'PATCH';
      if (action === 'update' && meeting.microsoft_event_id) {
        graphUrl = `${GATEWAY_URL}/me/events/${meeting.microsoft_event_id}`;
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
        attendees,
        isOnlineMeeting: true,
        onlineMeetingProvider: 'teamsForBusiness'
      };
    } else if (action === 'cancel' || action === 'delete') {
      if (!meeting.microsoft_event_id) {
        return new Response(JSON.stringify({ success: true, message: 'Nenhum evento Microsoft para cancelar.' }), { headers: corsHeaders });
      }
      graphUrl = `${GATEWAY_URL}/me/events/${meeting.microsoft_event_id}/cancel`;
      method = 'POST';
      body = { comment: meeting.cancel_reason || 'Cancelado via portal.' };
    }

    console.log("[TEAMS_SYNC_GRAPH_ENDPOINT]", graphUrl);
    console.log("[TEAMS_SYNC_GRAPH_PAYLOAD]", JSON.stringify(body, null, 2));

    const headers = {
      'Authorization': `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': teamsApiKey,
      'Content-Type': 'application/json',
    };

    // Log start attempt
    const { data: logEntry } = await supabase.from('meeting_sync_logs').insert({
      meeting_id: meetingId,
      action: action,
      request_payload: body,
      provider: 'microsoft_graph'
    }).select().single();

    const graphResponse = await fetch(graphUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const responseStatus = graphResponse.status;
    const responseText = await graphResponse.text();
    let responseData: any = {};
    try { responseData = JSON.parse(responseText); } catch (e) { responseData = { raw: responseText }; }

    console.log("[TEAMS_SYNC_GRAPH_STATUS]", responseStatus);
    console.log("[TEAMS_SYNC_GRAPH_RESPONSE]", JSON.stringify(responseData, null, 2));

    const success = graphResponse.ok || responseStatus === 204;

    // Update log
    if (logEntry) {
      await supabase.from('meeting_sync_logs').update({
        response_payload: responseData,
        status_code: responseStatus,
        success: success,
        error_message: success ? null : (responseData.error?.message || responseText)
      }).eq('id', logEntry.id);
    }

    if (success) {
      const updates: any = {
        microsoft_last_sync_at: new Date().toISOString(),
        microsoft_sync_status: 'success',
        microsoft_sync_error: null,
        microsoft_graph_response: responseData
      };

      if (action === 'create' || action === 'update') {
        if (responseData.id) updates.microsoft_event_id = responseData.id;
        if (responseData.webLink) updates.microsoft_event_web_link = responseData.webLink;
        
        const joinUrl = responseData.onlineMeeting?.joinUrl || 
                        responseData.onlineMeetingUrl || 
                        responseData.joinUrl || 
                        responseData.joinWebUrl;
        
        if (joinUrl) {
          updates.teams_join_url = joinUrl;
          updates.meeting_url = joinUrl;
          updates.location_url = joinUrl;
        }
      }

      const { error: updateError } = await supabase.from('meetings').update(updates).eq('id', meetingId);
      console.log("[TEAMS_SYNC_SAVE_RESULT]", updateError || "Sucesso");

      return new Response(JSON.stringify({ 
        success: true, 
        teamsJoinUrl: updates.teams_join_url, 
        microsoftEventId: updates.microsoft_event_id 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else {
      let errorCode = "MICROSOFT_GRAPH_ERROR";
      if (responseStatus === 403) errorCode = "MICROSOFT_PERMISSION_DENIED";
      if (responseStatus === 401) errorCode = "MICROSOFT_TOKEN_INVALID";

      await supabase.from('meetings').update({
        microsoft_sync_status: 'error',
        microsoft_sync_error: responseData.error?.message || responseText,
        microsoft_last_sync_at: new Date().toISOString()
      }).eq('id', meetingId);

      return new Response(JSON.stringify({ 
        success: false, 
        error_code: errorCode,
        message: responseData.error?.message || 'Erro na sincronização com Microsoft Graph.',
        details: responseData
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: responseStatus });
    }

  } catch (error) {
    console.error("[TEAMS_SYNC_ERROR]", {
      message: error.message,
      stack: error.stack
    });
    return new Response(JSON.stringify({ 
      success: false, 
      error_code: "INTERNAL_SERVER_ERROR",
      message: error.message || 'Erro inesperado na Edge Function.' 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
})
