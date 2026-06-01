import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
};

serve(async (req) => {
  console.log("create-google-meet-meeting chamada");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (!supabaseUrl) throw new Error("Variável SUPABASE_URL não configurada");
  if (!supabaseKey) throw new Error("Variável SUPABASE_SERVICE_ROLE_KEY não configurada");
  if (!clientId) throw new Error("Variável GOOGLE_CLIENT_ID não configurada");
  if (!clientSecret) throw new Error("Variável GOOGLE_CLIENT_SECRET não configurada");

  const supabase = createClient(supabaseUrl, supabaseKey);

  let meetingId: string | null = null;
  let action = 'create';

  try {
    const body = await req.json();
    meetingId = body.meetingId || body.meeting_id;
    action = body.action || 'create';

    if (!meetingId) {
       return new Response(JSON.stringify({
        success: false,
        error: "meeting_id é obrigatório"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*, client:client_id(trade_name, corporate_name, email), profile:consultant_id(full_name, email)')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) throw new Error(`Reunião ${meetingId} não encontrada`);
    if (meeting.status === 'cancelada') throw new Error("Não é possível sincronizar uma reunião cancelada");
    if (!meeting.meeting_date || !meeting.start_time) throw new Error("Reunião não possui data ou hora definida");

    // Get GLOBAL connection
    let { data: connection, error: connError } = await supabase
      .from('google_connections')
      .select('*')
      .eq('scope_type', 'global')
      .eq('status', 'active')
      .maybeSingle();

    if (connError || !connection) throw new Error("Conexão Google GLOBAL não configurada ou inativa.");
    if (!connection.refresh_token) throw new Error("Refresh token global ausente. O administrador deve reconectar.");

    // Check if token expired
    const expiresAt = new Date(connection.expires_at).getTime();
    if (expiresAt <= Date.now() + 300000) {
      console.log("Token global expirado ou expirando em breve, renovando...");
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: connection.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const tokens = await refreshResponse.json();
      if (!refreshResponse.ok) throw new Error("Falha ao renovar token Google Global: " + (tokens.error_description || tokens.error));
      
      const updates = {
        access_token: tokens.access_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      };
      await supabase.from('google_connections').update(updates).eq('id', connection.id);
      connection.access_token = tokens.access_token;
      console.log("Token global renovado com sucesso");
    }

    const accessToken = connection.access_token;

    if (action === 'create' || action === 'update') {
      console.log(`[Google Sync] Preparando payload para reunião ${meetingId}`, {
        date: meeting.meeting_date,
        time: meeting.start_time,
        duration: meeting.duration
      });

      // Secure date parsing
      let datePart = meeting.meeting_date;
      if (datePart.includes('/')) {
        const [d, m, y] = datePart.split('/');
        datePart = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }

      let timePart = meeting.start_time;
      if (timePart.split(':').length === 2) {
        timePart = `${timePart}:00`;
      }

      const startTimeISO = `${datePart}T${timePart}`;
      const startDate = new Date(startTimeISO);
      
      if (isNaN(startDate.getTime())) {
        throw new Error(`Data/hora inicial inválida: ${startTimeISO}`);
      }

      const duration = meeting.duration || 60;
      const endDate = new Date(startDate.getTime() + duration * 60000);
      
      if (isNaN(endDate.getTime())) {
        throw new Error(`Erro ao calcular data final da reunião`);
      }

      const attendees = [];
      if (meeting.client?.email) attendees.push({ email: meeting.client.email });
      if (meeting.profile?.email) attendees.push({ email: meeting.profile.email });
      if (Array.isArray(meeting.participants)) {
        meeting.participants.forEach((p: any) => {
          const email = typeof p === 'string' ? p : (p.email || p.address);
          if (email && !attendees.some(a => a.email === email)) attendees.push({ email });
        });
      }

      const eventBody = {
        summary: meeting.title || 'Reunião SEVEN',
        description: meeting.description || 'Agendado via Sistema SEVEN',
        start: {
          dateTime: startDate.toISOString().split('.')[0] + '-03:00',
          timeZone: 'America/Fortaleza',
        },
        end: {
          dateTime: endDate.toISOString().split('.')[0] + '-03:00',
          timeZone: 'America/Fortaleza',
        },
        conferenceData: {
          createRequest: {
            requestId: `meeting-${meeting.id}-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        attendees,
      };

      let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1';
      let method = 'POST';

      if (meeting.google_event_id) {
        url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${meeting.google_event_id}?conferenceDataVersion=1`;
        method = 'PATCH';
      }

      console.log(`Enviando ${method} para Google Calendar (Global):`, url);
      
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      });

      const event = await response.json();
      
      await supabase.from('meeting_sync_logs').insert({
        meeting_id: meetingId,
        action: `google_${action}`,
        success: response.ok,
        provider: 'google',
        request_payload: eventBody,
        response_payload: event,
        status_code: response.status,
        requested_by_user_id: meeting.consultant_id // Track who triggered it
      });

      if (!response.ok) {
        throw new Error(`Erro API Google (${response.status}): ${event.error?.message || JSON.stringify(event)}`);
      }

      const meetUrl = event.hangoutLink || event.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;

      await supabase.from('meetings').update({
        google_event_id: event.id,
        meet_join_url: meetUrl,
        calendar_sync_status: 'success',
        calendar_sync_error: null,
        location_url: meetUrl || meeting.location_url,
        sync_status: 'success',
        sync_error: null
      }).eq('id', meetingId);

      return new Response(JSON.stringify({ success: true, eventId: event.id, meetUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'delete' || action === 'cancel') {
      if (!meeting.google_event_id) {
         return new Response(JSON.stringify({ success: true, message: "Sem evento para deletar" }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${meeting.google_event_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      await supabase.from('meeting_sync_logs').insert({
        meeting_id: meetingId,
        action: 'google_cancel',
        success: response.ok || response.status === 404,
        provider: 'google',
        status_code: response.status
      });

      if (!response.ok && response.status !== 404) {
        const error = await response.json();
        throw new Error(`Erro API Google (${response.status}): ${error.error?.message || "Falha ao deletar"}`);
      }

      await supabase.from('meetings').update({
        calendar_sync_status: 'cancelled',
        sync_status: 'cancelled'
      }).eq('id', meetingId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error("Ação inválida");

  } catch (error: any) {
    console.error("EDGE_FUNCTION_ERROR", error);
    
    if (meetingId) {
      await supabase.from('meetings').update({
        calendar_sync_status: 'error',
        calendar_sync_error: error.message,
        sync_status: 'error',
        sync_error: error.message
      }).eq('id', meetingId);
    }

    return new Response(JSON.stringify({
      success: false,
      error: error?.message || "Erro desconhecido na Edge Function",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
})
