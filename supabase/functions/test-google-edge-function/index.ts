import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
};

serve(async (req) => {
  console.log("test-google-edge-function chamada");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  return new Response(JSON.stringify({
    success: true,
    message: "Edge Function funcionando",
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
})
