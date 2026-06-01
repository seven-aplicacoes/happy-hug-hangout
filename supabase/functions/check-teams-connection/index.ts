import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const apiKey = Deno.env.get('MICROSOFT_TEAMS_API_KEY')
  
  // Se a chave da API do Lovable Connector estiver presente, consideramos conectado.
  // Em uma implementação mais robusta, poderíamos fazer uma chamada de teste (/me).
  const isConnected = !!apiKey

  return new Response(
    JSON.stringify({ isConnected }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
