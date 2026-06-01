import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VERSION = 'v8-advanced';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  const outlookApiKey = Deno.env.get('MICROSOFT_OUTLOOK_API_KEY');
  const teamsApiKey = Deno.env.get('MICROSOFT_TEAMS_API_KEY');

  const supabase = createClient(supabaseUrl, supabaseKey);

  let body: any = {};
  if (req.method === 'POST') {
    try { body = await req.json(); } catch { body = {}; }
  }

  const { meetingId, action: requestedAction = 'sync' } = body;
  console.log(`[TEAMS_SYNC] ${VERSION} triggered`, { meetingId, requestedAction });

  // Function to log sync activity
  const logSync = async (meeting_id: string, action: string, success: boolean, data: any) => {
    try {
      await supabase.from('meeting_sync_logs').insert({
        meeting_id,
        action,
        success,
        provider: data.provider || 'microsoft',
        status_code: data.status,
        request_payload: data.request || null,
        response_payload: data.response || null,
        error_message: data.error || null
      });
    } catch (e) {
      console.error('Error saving sync log:', e);
    }
  };

  try {
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY missing");

    if (requestedAction === 'test_connection' || requestedAction === 'test_calendar' || req.method === 'GET') {
      const cid = 'microsoft_outlook';
      const akey = outlookApiKey;
      const url = `https://connector-gateway.lovable.dev/${cid}/me`;
      
      const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'X-Connection-Api-Key': akey! } });
      const data = await resp.json().catch(() => ({ raw: "Error parsing JSON" }));
      
      return new Response(JSON.stringify({ 
        success: resp.ok,
        version: VERSION, 
        connector: cid, 
        status: resp.status, 
        data 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!meetingId) throw new Error("Missing meetingId");

    // Start sync log
    await logSync(meetingId, 'sync_start', true, { info: 'Iniciando sincronização' });

    const { data: meeting, error: fetchError } = await supabase
      .from('meetings')
      .select('*, client:client_id(*), consultant:consultant_id(*)')
      .eq('id', meetingId)
      .single();

    if (fetchError || !meeting) {
      await logSync(meetingId, 'error_meeting_not_found', false, { error: fetchError?.message || "Reunião não encontrada" });
      throw new Error("Meeting not found");
    }

    await logSync(meetingId, 'meeting_found', true, { meeting_title: meeting.title });

    // Determinando conectores e chaves
    const connectors = [
      { id: 'microsoft_outlook', key: outlookApiKey },
      { id: 'microsoft_teams', key: teamsApiKey }
    ].filter(c => !!c.key);

    let success = false;
    let finalData: any = {};
    let finalConnector = '';
    const attemptLogs: any[] = [];

    for (const connector of connectors) {
      const url = `https://connector-gateway.lovable.dev/${connector.id}/me/events`;
      
      // Montagem do payload base
      const eventBody: any = {
        subject: meeting.title || 'Reunião SEVEN',
        body: {
          contentType: 'HTML',
          content: meeting.description || 'Reunião agendada via Sistema SEVEN'
        },
        start: { 
          dateTime: `${meeting.meeting_date}T${meeting.start_time}`, 
          timeZone: 'America/Fortaleza' 
        },
        end: { 
          // Default duration 1h if not specified
          dateTime: new Date(new Date(`${meeting.meeting_date}T${meeting.start_time}`).getTime() + (meeting.duration || 60) * 60000).toISOString(),
          timeZone: 'America/Fortaleza' 
        },
        isOnlineMeeting: true,
        attendees: Array.isArray(meeting.participants) ? meeting.participants.map((p: any) => ({
          emailAddress: { address: typeof p === 'string' ? p : (p.email || p.address), name: typeof p === 'string' ? p : (p.nome || p.name) },
          type: 'required'
        })) : []
      };

      // Adicionando organizador se houver email do consultor
      if (meeting.consultant?.email) {
        // MS Graph doesn't let you set organizer in create, but we can log it
      }

      await logSync(meetingId, `payload_prepared_${connector.id}`, true, { request: eventBody, provider: connector.id });

      // Tentativa 1: Sem onlineMeetingProvider explícito (Melhor para contas pessoais)
      console.log(`[TEAMS_SYNC] Attempting ${connector.id} without explicit provider`);
      let resp = await fetch(url, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${lovableApiKey}`, 
          'X-Connection-Api-Key': connector.key!, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(eventBody)
      });
      
      let responseText = await resp.text();
      let responseData;
      try { responseData = JSON.parse(responseText); } catch { responseData = { raw: responseText }; }

      attemptLogs.push({ 
        connector: connector.id, 
        attempt: 'no_provider', 
        status: resp.status, 
        response: responseData 
      });

      // Tentativa 2: Com teamsForBusiness se a primeira falhar e não for erro de auth
      if (!resp.ok && resp.status !== 401 && resp.status !== 403) {
        console.log(`[TEAMS_SYNC] Attempting ${connector.id} with teamsForBusiness`);
        eventBody.onlineMeetingProvider = 'teamsForBusiness';
        
        resp = await fetch(url, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${lovableApiKey}`, 
            'X-Connection-Api-Key': connector.key!, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(eventBody)
        });
        
        responseText = await resp.text();
        try { responseData = JSON.parse(responseText); } catch { responseData = { raw: responseText }; }
        
        attemptLogs.push({ 
          connector: connector.id, 
          attempt: 'teamsForBusiness', 
          status: resp.status, 
          response: responseData 
        });
      }

      if (resp.ok) {
        finalData = responseData;
        success = true;
        finalConnector = connector.id;
        break;
      } else {
        finalData = responseData; // Keep last error
      }
    }

    // Processando resultado final
    const joinUrl = finalData.onlineMeeting?.joinUrl || finalData.joinUrl || finalData.onlineMeetingUrl || null;
    
    const updates = {
      microsoft_last_sync_at: new Date().toISOString(),
      microsoft_sync_status: success ? 'success' : 'error',
      microsoft_sync_error: success ? null : JSON.stringify({ 
        message: "Failed to create meeting", 
        details: finalData,
        attempts: attemptLogs 
      }),
      teams_join_url: joinUrl,
      microsoft_event_id: finalData.id || null,
      microsoft_event_web_link: finalData.webLink || null,
      microsoft_graph_response: finalData,
      sync_status: success ? 'success' : 'error',
      sync_error: success ? null : (finalData.error?.message || JSON.stringify(finalData))
    };

    const { error: updateError } = await supabase.from('meetings').update(updates).eq('id', meetingId);
    
    if (updateError) {
      await logSync(meetingId, 'error_supabase_update', false, { error: updateError.message });
      throw new Error(`Error updating meeting in Supabase: ${updateError.message}`);
    }

    await logSync(meetingId, 'sync_finished', success, { 
      provider: finalConnector, 
      status: success ? 200 : (attemptLogs[attemptLogs.length-1]?.status || 500),
      response: finalData 
    });

    return new Response(JSON.stringify({ 
      success, 
      version: VERSION, 
      connector: finalConnector, 
      data: finalData, 
      joinUrl,
      logs: attemptLogs 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error(`[TEAMS_SYNC] ERROR:`, err);
    
    // Tentamos logar o erro se tivermos o meetingId
    if (meetingId) {
      await logSync(meetingId, 'sync_fatal_error', false, { error: err.message });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message, 
      version: VERSION,
      type: err.message.includes('API_KEY') ? 'config_error' : 'runtime_error'
    }), { 
      status: 200, // Return 200 to handle error in frontend JSON response
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})
