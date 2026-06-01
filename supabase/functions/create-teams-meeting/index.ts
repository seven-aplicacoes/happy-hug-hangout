import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VERSION = 'v9-robust';

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

  const logSync = async (meeting_id: string, action: string, success: boolean, data: any) => {
    try {
      if (!meeting_id) return;
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

    // Diagnostic/Test Action
    if (requestedAction === 'test_connection' || requestedAction === 'test_calendar' || req.method === 'GET') {
      const cid = outlookApiKey ? 'microsoft_outlook' : 'microsoft_teams';
      const akey = outlookApiKey || teamsApiKey;
      if (!akey) throw new Error("Microsoft API Key missing (OUTLOOK or TEAMS)");
      
      const url = `https://connector-gateway.lovable.dev/${cid}/me`;
      const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'X-Connection-Api-Key': akey } });
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

    await logSync(meetingId, 'sync_start', true, { info: 'Iniciando sincronização robusta v9' });

    const { data: meeting, error: fetchError } = await supabase
      .from('meetings')
      .select('*, client:client_id(*), consultant:consultant_id(*)')
      .eq('id', meetingId)
      .single();

    if (fetchError || !meeting) {
      await logSync(meetingId, 'error_meeting_not_found', false, { error: fetchError?.message || "Reunião não encontrada" });
      throw new Error("Meeting not found");
    }

    // Connectors to try
    const connectors = [
      { id: 'microsoft_outlook', key: outlookApiKey },
      { id: 'microsoft_teams', key: teamsApiKey }
    ].filter(c => !!c.key);

    if (connectors.length === 0) {
      throw new Error("Nenhuma conexão Microsoft configurada (API Keys ausentes)");
    }

    let success = false;
    let finalData: any = {};
    let finalConnector = '';
    const attemptLogs: any[] = [];

    for (const connector of connectors) {
      const url = `https://connector-gateway.lovable.dev/${connector.id}/me/events`;
      
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
          dateTime: new Date(new Date(`${meeting.meeting_date}T${meeting.start_time}`).getTime() + (meeting.duration || 60) * 60000).toISOString(),
          timeZone: 'America/Fortaleza' 
        },
        isOnlineMeeting: true,
        attendees: Array.isArray(meeting.participants) ? meeting.participants.map((p: any) => {
          const email = typeof p === 'string' ? p : (p.email || p.address);
          const name = typeof p === 'string' ? p : (p.nome || p.name || email);
          return {
            emailAddress: { address: email, name: name },
            type: 'required'
          };
        }) : []
      };

      // Strategy 1: Standard Online Meeting
      console.log(`[TEAMS_SYNC] Strategy 1: Standard Online Meeting via ${connector.id}`);
      let resp = await fetch(url, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${lovableApiKey}`, 
          'X-Connection-Api-Key': connector.key!, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(eventBody)
      });
      
      let responseData = await resp.json().catch(async () => ({ raw: await resp.text() }));
      attemptLogs.push({ strategy: 'standard_online', connector: connector.id, status: resp.status, response: responseData });

      // Strategy 2: If 403 (Access Denied), try specific provider for Business
      if (!resp.ok && (resp.status === 403 || resp.status === 400)) {
        console.log(`[TEAMS_SYNC] Strategy 2: Business Provider via ${connector.id}`);
        const businessBody = { ...eventBody, onlineMeetingProvider: 'teamsForBusiness' };
        resp = await fetch(url, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${lovableApiKey}`, 
            'X-Connection-Api-Key': connector.key!, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(businessBody)
        });
        responseData = await resp.json().catch(async () => ({ raw: await resp.text() }));
        attemptLogs.push({ strategy: 'business_provider', connector: connector.id, status: resp.status, response: responseData });
      }

      // Strategy 3: If still failing, try to check if user has a Teams license or try creating without online link
      if (!resp.ok && (resp.status === 403 || resp.status === 400)) {
        console.log(`[TEAMS_SYNC] Strategy 3: Fallback to regular event (No Teams Link) via ${connector.id}`);
        const fallbackBody = { ...eventBody, isOnlineMeeting: false };
        resp = await fetch(url, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${lovableApiKey}`, 
            'X-Connection-Api-Key': connector.key!, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(fallbackBody)
        });
        responseData = await resp.json().catch(async () => ({ raw: await resp.text() }));
        attemptLogs.push({ strategy: 'no_online_link', connector: connector.id, status: resp.status, response: responseData });
      }

      if (resp.ok) {
        finalData = responseData;
        success = true;
        finalConnector = connector.id;
        break;
      } else {
        finalData = responseData;
      }
    }

    const joinUrl = finalData.onlineMeeting?.joinUrl || finalData.joinUrl || finalData.onlineMeetingUrl || null;
    
    // We update the meeting with results
    const updates = {
      microsoft_last_sync_at: new Date().toISOString(),
      microsoft_sync_status: success ? 'success' : 'error',
      microsoft_sync_error: success ? null : JSON.stringify({ 
        message: "Falha ao criar reunião após múltiplas estratégias", 
        details: finalData,
        attempts: attemptLogs 
      }),
      teams_join_url: joinUrl,
      microsoft_event_id: finalData.id || null,
      microsoft_event_web_link: finalData.webLink || null,
      microsoft_graph_response: finalData,
      sync_status: success ? 'success' : 'error',
      sync_error: success ? (joinUrl ? null : "Evento criado mas link do Teams falhou") : (finalData.error?.message || JSON.stringify(finalData))
    };

    await supabase.from('meetings').update(updates).eq('id', meetingId);
    
    await logSync(meetingId, 'sync_finished', success, { 
      provider: finalConnector, 
      status: success ? 200 : (attemptLogs[attemptLogs.length-1]?.status || 500),
      response: finalData,
      strategy: attemptLogs.find(a => a.status < 300)?.strategy || 'failed'
    });

    return new Response(JSON.stringify({ 
      success, 
      version: VERSION, 
      connector: finalConnector, 
      data: finalData, 
      joinUrl,
      strategies: attemptLogs 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error(`[TEAMS_SYNC] FATAL ERROR:`, err);
    if (meetingId) await logSync(meetingId, 'sync_fatal_error', false, { error: err.message });

    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message, 
      version: VERSION,
      type: 'runtime_error'
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})
