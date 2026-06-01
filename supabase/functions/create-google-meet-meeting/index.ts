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

  let meetingId: string | null = null;
  let action = 'create';

  try {
    const body = await req.json();
    meetingId = body.meetingId;
    action = body.action || 'create';

    if (action === 'test_connection') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error("Unauthorized");
      const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (userError || !user) throw new Error("User not found");

      const { data: connection } = await supabase.from('google_connections').select('*').eq('user_id', user.id).single();
      if (!connection) return new Response(JSON.stringify({ success: false, error: "Google not connected" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      
      return new Response(JSON.stringify({ 
        success: true, 
        email: connection.google_email,
        scopes: connection.scopes,
        hasRefreshToken: !!connection.refresh_token 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!meetingId) throw new Error("Missing meetingId");

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*, client:client_id(trade_name, corporate_name, email), profile:consultant_id(full_name, email)')
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

    // Check if token expired (or about to expire in 5 min)
    const expiresAt = new Date(connection.expires_at).getTime();
    if (expiresAt <= Date.now() + 300000) {
      console.log("Token expired or expiring soon, refreshing...");
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
          refresh_token: connection.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const tokens = await refreshResponse.json();
      if (!refreshResponse.ok) throw new Error("Failed to refresh Google token: " + (tokens.error_description || tokens.error));
      
      const updates = {
        access_token: tokens.access_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      };
      await supabase.from('google_connections').update(updates).eq('user_id', userId);
      connection.access_token = tokens.access_token;
    }

    const accessToken = connection.access_token;

    if (action === 'create' || action === 'update') {
      const startTimeISO = `${meeting.meeting_date}T${meeting.start_time}:00`;
      const startDate = new Date(startTimeISO);
      const endDate = new Date(startDate.getTime() + (meeting.duration || 60) * 60000);
      
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
          dateTime: startTimeISO,
          timeZone: 'America/Fortaleza',
        },
        end: {
          dateTime: endDate.toISOString().replace(/\.\d+Z$/, '-03:00'), // Ensure correct format for Fortaleza
          timeZone: 'America/Fortaleza',
        },
        conferenceData: {
          createRequest: {
            requestId: `meeting-${meeting.id}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        attendees,
      };

      // Fix start date format too
      eventBody.start.dateTime = startDate.toISOString().replace(/\.\d+Z$/, '-03:00');

      let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1';
      let method = 'POST';

      if (meeting.google_event_id) {
        url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${meeting.google_event_id}?conferenceDataVersion=1`;
        method = 'PATCH'; // Use PATCH for updates to avoid overwriting fields we don't send
      }

      console.log(`Sending ${method} request to Google Calendar for meeting ${meetingId}`);
      
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      });

      const event = await response.json();
      
      // Log interaction
      await supabase.from('meeting_sync_logs').insert({
        meeting_id: meetingId,
        action: `google_${action}`,
        success: response.ok,
        provider: 'google',
        request_payload: eventBody,
        response_payload: event,
        status_code: response.status
      });

      if (!response.ok) {
        throw new Error(`Google API Error (${response.status}): ${event.error?.message || JSON.stringify(event)}`);
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
         return new Response(JSON.stringify({ success: true, message: "No event to delete" }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${meeting.google_event_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Log interaction
      await supabase.from('meeting_sync_logs').insert({
        meeting_id: meetingId,
        action: 'google_cancel',
        success: response.ok || response.status === 404,
        provider: 'google',
        status_code: response.status
      });

      if (!response.ok && response.status !== 404) {
        const error = await response.json();
        throw new Error(`Google API Error (${response.status}): ${error.error?.message || "Failed to delete"}`);
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
    console.error("Google Function Error:", err);
    
    if (meetingId) {
      await supabase.from('meetings').update({
        calendar_sync_status: 'error',
        calendar_sync_error: err.message,
        sync_status: 'error',
        sync_error: err.message
      }).eq('id', meetingId);
    }

    return new Response(JSON.stringify({ error: err.message, success: false }), {
      status: 200, // Keep 200 so the client can handle the error object gracefully
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
