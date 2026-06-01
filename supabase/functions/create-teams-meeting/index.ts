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
  console.log(`[microsoft-sync] [TEAMS_LINK_START] Function started at ${startTimeStr}`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const teamsApiKey = Deno.env.get('MICROSOFT_TEAMS_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!lovableApiKey || !teamsApiKey) {
      console.error('[microsoft-sync] Missing API keys');
      return new Response(
        JSON.stringify({ success: false, error: 'Conector Microsoft não configurado corretamente.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const { meetingId, action: requestedAction } = await req.json();
    console.log(`[microsoft-sync] [TEAMS_LINK_START] Action: ${requestedAction}, MeetingID: ${meetingId}`);

    if (!meetingId) {
      return new Response(JSON.stringify({ success: false, error: 'meetingId é obrigatório.', message: 'ID da reunião não fornecido.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[microsoft-sync] [TEAMS_LINK_FETCH_MEETING_START] Fetching meeting data for: ${meetingId}`);

    // 1. Fetch meeting data with client and consultant info
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
      console.error('[microsoft-sync] [TEAMS_LINK_ERROR] Meeting not found:', meetingError);
      return new Response(JSON.stringify({ success: false, error: 'Reunião não encontrada.', message: 'A reunião solicitada não existe no banco de dados.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[microsoft-sync] [TEAMS_LINK_MEETING_DATA]`, {
      meetingId: meeting.id,
      clientId: meeting.client_id,
      consultantId: meeting.consultant_id,
      startTime: meeting.start_time,
      endTime: meeting.end_time, // Verificando se existe
      status: meeting.status,
      existingMicrosoftEventId: meeting.microsoft_event_id,
      existingTeamsJoinUrl: meeting.teams_join_url
    });

    console.log(`[microsoft-sync] [TEAMS_LINK_VALIDATE_DATA]`);
    
    if (!meeting.client?.email) {
      return new Response(JSON.stringify({ 
        success: false, 
        error_code: "CLIENT_EMAIL_MISSING",
        message: "O cliente não possui e-mail cadastrado. Cadastre um e-mail antes de gerar o link do Teams." 
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!meeting.consultant?.email) {
      return new Response(JSON.stringify({ 
        success: false, 
        error_code: "CONSULTANT_EMAIL_MISSING",
        message: "O consultor responsável não possui e-mail cadastrado. Verifique o cadastro do consultor." 
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!meeting.meeting_date || !meeting.start_time) {
       return new Response(JSON.stringify({ 
        success: false, 
        message: "A reunião precisa de data e hora de início para gerar o link." 
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const action = requestedAction || (meeting.microsoft_event_id ? 'update' : 'create');
    const headers = {
      'Authorization': `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': teamsApiKey,
      'Content-Type': 'application/json',
    };

    let graphUrl = `${GATEWAY_URL}/v1.0/me/events`;
    let method = 'POST';
    let body: any = null;

    // Build attendees
    const attendees = [];
    if (meeting.client?.email) {
      attendees.push({
        emailAddress: { address: meeting.client.email, name: meeting.client.trade_name || meeting.client.corporate_name },
        type: 'required'
      });
    }
    if (meeting.consultant?.email) {
      attendees.push({
        emailAddress: { address: meeting.consultant.email, name: meeting.consultant.full_name },
        type: 'required'
      });
    }

    const timezone = meeting.timezone || 'America/Fortaleza';
    
    // Prepare start/end times in ISO without 'Z' if timezone is provided, or as is
    // Graph expects: { dateTime: "2023-01-01T10:00:00", timeZone: "America/Fortaleza" }
    const startDateTime = meeting.meeting_date ? `${meeting.meeting_date}T${meeting.start_time}` : null;
    
    // Calculate end time
    const [hours, minutes] = (meeting.start_time || "00:00").split(':').map(Number);
    const endDate = new Date(meeting.meeting_date);
    endDate.setHours(hours, minutes + (meeting.duration || 60));
    const endDateTime = `${meeting.meeting_date}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;

    if (action === 'create' || action === 'update') {
      method = action === 'create' ? 'POST' : 'PATCH';
      if (action === 'update' && meeting.microsoft_event_id) {
        graphUrl = `${GATEWAY_URL}/v1.0/me/events/${meeting.microsoft_event_id}`;
      }

      body = {
        subject: meeting.title,
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
      
      // Use cancel endpoint if available, otherwise DELETE
      graphUrl = `${GATEWAY_URL}/v1.0/me/events/${meeting.microsoft_event_id}/cancel`;
      method = 'POST';
      body = { comment: meeting.cancel_reason || 'Cancelado via portal.' };
    }

    console.log(`[microsoft-sync] Calling Graph: ${method} ${graphUrl}`);
    
    // Log the attempt
    const { data: logEntry } = await supabase.from('meeting_sync_logs').insert({
      meeting_id: meetingId,
      action: action,
      request_payload: body,
      provider: 'microsoft_graph'
    }).select().single();

    const response = await fetch(graphUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const responseStatus = response.status;
    const responseText = await response.text();
    let responseData: any = {};
    try { responseData = JSON.parse(responseText); } catch (e) { responseData = { raw: responseText }; }

    console.log(`[microsoft-sync] Graph response status: ${responseStatus}`);

    const success = response.ok || responseStatus === 204;

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

      await supabase.from('meetings').update(updates).eq('id', meetingId);

      return new Response(JSON.stringify({ 
        success: true, 
        teamsJoinUrl: updates.teams_join_url, 
        microsoftEventId: updates.microsoft_event_id 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else {
      await supabase.from('meetings').update({
        microsoft_sync_status: 'error',
        microsoft_sync_error: responseData.error?.message || responseText,
        microsoft_last_sync_at: new Date().toISOString()
      }).eq('id', meetingId);

      return new Response(JSON.stringify({ 
        success: false, 
        error: responseData.error?.message || 'Erro na sincronização com Microsoft Graph.',
        details: responseData
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: responseStatus });
    }

  } catch (error) {
    console.error('[microsoft-sync] Global error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: corsHeaders, status: 500 });
  }
})
