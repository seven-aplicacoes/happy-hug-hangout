import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { meetingId, status, minutes, manualLink, cancelReason } = await req.json();
    
    const updateData: any = {};
    const historyAction: string[] = [];

    if (status) {
      updateData.status = status;
      if (status === 'concluida') {
        updateData.completed_at = new Date().toISOString();
        // Assuming there's an auth user context from headers would be best, 
        // but service role allows direct update.
      } else if (status === 'cancelada') {
        updateData.canceled_at = new Date().toISOString();
        updateData.cancel_reason = cancelReason;
      }
    }

    if (manualLink !== undefined) {
      updateData.location_url = manualLink;
      updateData.meeting_link_provider = 'manual';
    }

    const { error } = await supabase.from('meetings').update(updateData).eq('id', meetingId);
    if (error) throw error;

    // Handle minutes registration if provided
    if (minutes) {
        await supabase.from('meeting_minutes').upsert({
            meeting_id: meetingId,
            summary: minutes.summary,
            decisions: minutes.decisions,
            next_steps: minutes.next_steps,
            internal_notes: minutes.internal_notes
        });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});