import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    const teamsApiKey = Deno.env.get('MICROSOFT_TEAMS_API_KEY')

    if (!lovableApiKey || !teamsApiKey) {
      return new Response(
        JSON.stringify({ isConnected: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify connection via gateway's verify_credentials endpoint
    const response = await fetch('https://connector-gateway.lovable.dev/api/v1/verify_credentials', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'X-Connection-Api-Key': teamsApiKey,
      },
    })

    const isConnected = response.ok
    return new Response(
      JSON.stringify({ isConnected }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('check-teams-connection error:', err)
    return new Response(
      JSON.stringify({ isConnected: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
