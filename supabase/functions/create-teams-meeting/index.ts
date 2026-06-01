import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VERSION = 'v7-final';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
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

    const { meetingId, action: requestedAction, connector: requestedConnector } = body;
    console.log(`[TEAMS_SYNC] ${VERSION} triggered`, { meetingId, requestedAction });

    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY missing");

    if (requestedAction === 'test_calendar' || req.method === 'GET') {
      const cid = requestedConnector || 'microsoft_outlook';
      const akey = cid === 'microsoft_teams' ? teamsApiKey : outlookApiKey;
      const url = `https://connector-gateway.lovable.dev/${cid}/me`;
      const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'X-Connection-Api-Key': akey! } });
      const data = await resp.text();
      return new Response(JSON.stringify({ version: VERSION, connector: cid, status: resp.status, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!meetingId) throw new Error("Missing meetingId");

    const { data: meeting } = await supabase.from('meetings').select('*, client:client_id(*), consultant:consultant_id(*)').eq('id', meetingId).single();
    if (!meeting) throw new Error("Meeting not found");

    const connectors = requestedConnector ? [requestedConnector] : ['microsoft_outlook', 'microsoft_teams'];
    let success = false;
    let finalData: any = {};
    let finalConnector = '';
    const logs: any[] = [];

    for (const cid of connectors) {
      const akey = cid === 'microsoft_teams' ? teamsApiKey : outlookApiKey;
      if (!akey) continue;

      const url = `https://connector-gateway.lovable.dev/${cid}/me/events`;
      const eventBody: any = {
        subject: meeting.title || 'Reunião SEVEN',
        start: { dateTime: `${meeting.meeting_date}T${meeting.start_time}`, timeZone: 'America/Fortaleza' },
        end: { dateTime: `${meeting.meeting_date}T${meeting.start_time}`, timeZone: 'America/Fortaleza' },
        isOnlineMeeting: true,
        onlineMeetingProvider: 'teamsForBusiness'
      };

      // Try 1: teamsForBusiness
      let resp = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'X-Connection-Api-Key': akey, 'Content-Type': 'application/json' },
        body: JSON.stringify(eventBody)
      });
      let text = await resp.text();
      logs.push({ connector: cid, provider: 'teamsForBusiness', status: resp.status, response: text });

      // Try 2: default (no provider specified - often works for personal accounts)
      if (!resp.ok) {
        delete eventBody.onlineMeetingProvider;
        resp = await fetch(url, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'X-Connection-Api-Key': akey, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventBody)
        });
        text = await resp.text();
        logs.push({ connector: cid, provider: 'default', status: resp.status, response: text });
      }

      if (resp.ok) {
        try { finalData = JSON.parse(text); } catch { finalData = { raw: text }; }
        success = true;
        finalConnector = cid;
        break;
      }
      
      // Keep last error for reporting
      try { finalData = JSON.parse(text); } catch { finalData = { raw: text }; }
    }

    const updates = {
      microsoft_last_sync_at: new Date().toISOString(),
      microsoft_sync_status: success ? 'success' : 'error',
      microsoft_sync_error: success ? null : JSON.stringify(finalData),
      teams_join_url: finalData.onlineMeeting?.joinUrl || finalData.joinUrl || finalData.onlineMeetingUrl || null
    };

    await supabase.from('meetings').update(updates).eq('id', meetingId);
    return new Response(JSON.stringify({ success, version: VERSION, connector: finalConnector, data: finalData, logs }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message, version: VERSION }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})
