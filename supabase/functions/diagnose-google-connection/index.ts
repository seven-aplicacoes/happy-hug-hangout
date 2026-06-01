import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
};

serve(async (req) => {
  console.log("diagnose-google-connection chamada");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl) throw new Error("Variável SUPABASE_URL não configurada");
    if (!supabaseKey) throw new Error("Variável SUPABASE_SERVICE_ROLE_KEY não configurada");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Header de Autorização ausente");

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error("Usuário não autenticado ou sessão expirada");

    const { data: connection, error: connError } = await supabase
      .from('google_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Google não conectado para este usuário" 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Test token validity
    const tokenResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${connection.access_token}` },
    });

    let tokenStatus = 'valid';
    if (!tokenResponse.ok) {
      tokenStatus = 'expired_or_invalid';
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        email: connection.google_email,
        scopes: connection.scopes,
        hasRefreshToken: !!connection.refresh_token,
        tokenStatus,
        expiresAt: connection.expires_at,
        lastUpdated: connection.updated_at
      }
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error("EDGE_FUNCTION_ERROR", error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || "Erro desconhecido na Edge Function",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
})
