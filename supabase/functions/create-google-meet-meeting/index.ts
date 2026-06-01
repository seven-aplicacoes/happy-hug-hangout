import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { meetingId, action = 'create' } = await req.json();
    if (!meetingId) throw new Error("Missing meetingId");

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*, client:client_id(trade_name, corporate_name)')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) throw new Error("Meeting not found");

    const userId = meeting.consultant_id;
    if (!userId) throw new Error("Meeting has no consultant assigned");

    // Get connection
    let { data: connection, error: connError } = await supabase
      .from('google_connections')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (connError || !connection) throw new Error("Google connection not found for this consultant");

    // Check if token expired
    if (new Date(connection.expires_at) <= new Date()) {
      console.log("Token expired, refreshing...");
      const refreshResp = await fetch(`${supabaseUrl}/functions/v1/refresh-google-token`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization')!
        },
        body: JSON.stringify({ userId }),
      });
      const refreshData = await refreshResp.json();
      if (!refreshResp.ok) throw new Error("Failed to refresh Google token: " + refreshData.error);
      
      // Get updated connection
      const { data: newConn } = await supabase
        .from('google_connections')
        .select('*')
        .eq('user_id', userId)
        .single();
      connection = newConn;
    }

    const accessToken = connection.access_token;

    if (action === 'create' || action === 'update') {
      const eventBody = {
        summary: meeting.title || 'Reunião SEVEN',
        description: meeting.description || 'Agendado via Sistema SEVEN',
        start: {
          dateTime: `${meeting.meeting_date}T${meeting.start_time}:00`,
          timeZone: 'America/Fortaleza',
        },
        end: {
          dateTime: new Date(new Date(`${meeting.meeting_date}T${meeting.start_time}:00`).getTime() + (meeting.duration || 60) * 60000).toISOString(),
          timeZone: 'America/Fortaleza',
        },
        conferenceData: {
          createRequest: {
            requestId: meeting.id,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        attendees: Array.isArray(meeting.participants) ? meeting.participants.map((p: any) => {
          const email = typeof p === 'string' ? p : (p.email || p.address);
          return { email };
        }) : [],
      };

      let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1';
      let method = 'POST';

      if (action === 'update' && meeting.google_event_id) {
        url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${meeting.google_event_id}?conferenceDataVersion=1`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      });

      const event = await response.json();
      if (!response.ok) throw new Error(event.error?.message || "Failed to manage Google Calendar event");

      const meetUrl = event.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;

      await supabase.from('meetings').update({
        google_event_id: event.id,
        meet_join_url: meetUrl,
        calendar_sync_status: 'success',
        calendar_sync_error: null,
        // Also update the generic columns for compatibility
        location_url: meetUrl || meeting.location_url,
        sync_status: 'success'
      }).eq('id', meetingId);

      // Log success
      await supabase.from('meeting_sync_logs').insert({
        meeting_id: meetingId,
        action: `google_${action}`,
        success: true,
        provider: 'google',
        response_payload: event
      });

      return new Response(JSON.stringify({ success: true, eventId: event.id, meetUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'delete' || action === 'cancel') {
      if (!meeting.google_event_id) {
         return new Response(JSON.stringify({ success: true, message: "No event to delete" }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${meeting.google_event_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok && response.status !== 404) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to delete Google Calendar event");
      }

      await supabase.from('meetings').update({
        calendar_sync_status: 'cancelled',
        sync_status: 'cancelled'
      }).eq('id', meetingId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error("Invalid action");

  } catch (err: any) {
    console.error("Google Meet creation error:", err);
    
    if (meetingId) {
      await supabase.from('meetings').update({
        calendar_sync_status: 'error',
        calendar_sync_error: err.message,
        sync_status: 'error',
        sync_error: err.message
      }).eq('id', meetingId);

      await supabase.from('meeting_sync_logs').insert({
        meeting_id: meetingId,
        action: 'google_error',
        success: false,
        provider: 'google',
        error_message: err.message
      });
    }

    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
