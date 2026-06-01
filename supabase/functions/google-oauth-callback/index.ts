import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
};

serve(async (req) => {
  console.log("google-oauth-callback chamada");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { code, redirect_uri } = await req.json();
    if (!code) throw new Error("Código de autorização ausente");

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const defaultRedirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');
    const redirectUri = redirect_uri || defaultRedirectUri;

    if (!clientId) throw new Error("Variável GOOGLE_CLIENT_ID não configurada");
    if (!clientSecret) throw new Error("Variável GOOGLE_CLIENT_SECRET não configurada");
    if (!redirectUri) throw new Error("Variável GOOGLE_REDIRECT_URI não configurada");

    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(tokens.error_description || tokens.error || "Falha ao trocar código por token");

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userResponse.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) throw new Error("Configuração Supabase ausente");

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Header de Autorização ausente");
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error("Usuário não autenticado");

    // Check if user is admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') throw new Error("Apenas administradores podem configurar a conexão global.");

    // Update or Insert global connection
    const { error: upsertError } = await supabase
      .from('google_connections')
      .upsert({
        scope_type: 'global',
        connected_by: user.id,
        google_email: userInfo.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        scopes: tokens.scope?.split(' '),
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'scope_type', where: "scope_type = 'global'" });

    // Fallback if the upsert onConflict fails due to lack of unique constraint on scope_type
    if (upsertError) {
      console.log("Upsert failed, trying manual update for global connection");
      const { data: existingGlobal } = await supabase
        .from('google_connections')
        .select('id')
        .eq('scope_type', 'global')
        .maybeSingle();

      if (existingGlobal) {
        const { error: updateError } = await supabase
          .from('google_connections')
          .update({
            connected_by: user.id,
            google_email: userInfo.email,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || undefined,
            expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            scopes: tokens.scope?.split(' '),
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingGlobal.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('google_connections')
          .insert({
            scope_type: 'global',
            connected_by: user.id,
            google_email: userInfo.email,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            scopes: tokens.scope?.split(' '),
            status: 'active',
          });
        if (insertError) throw insertError;
      }
    }

    return new Response(JSON.stringify({ success: true, email: userInfo.email }), {
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
