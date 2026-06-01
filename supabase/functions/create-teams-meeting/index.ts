import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/microsoft_teams'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    const teamsApiKey = Deno.env.get('MICROSOFT_TEAMS_API_KEY')

    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY is not configured')
    if (!teamsApiKey) throw new Error('MICROSOFT_TEAMS_API_KEY is not configured (Microsoft Teams connector not linked)')

    const { title, description, startDateTime, endDateTime } = await req.json()

    const headers = {
      'Authorization': `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': teamsApiKey,
      'Content-Type': 'application/json',
    }

    const response = await fetch(`${GATEWAY_URL}/v1.0/me/onlineMeetings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        subject: title,
        startDateTime,
        endDateTime,
      })
    })

    const rawText = await response.text()
    let data: any = null
    try {
      data = rawText ? JSON.parse(rawText) : null
    } catch {
      // Non-JSON response (e.g. "Not Found" from gateway)
      console.error('Non-JSON response from gateway:', response.status, rawText)
      throw new Error(`Gateway returned ${response.status}: ${rawText.slice(0, 200)}`)
    }

    if (!response.ok || data?.error) {
      console.error('Gateway error:', response.status, data)
      const message = data?.error?.message || data?.message || `Status ${response.status}`
      throw new Error(message)
    }

    if (!data?.joinWebUrl) {
      console.error('No joinWebUrl in response:', data)
      throw new Error('Meeting created but no join URL returned')
    }

    return new Response(
      JSON.stringify({
        success: true,
        teamsJoinUrl: data.joinWebUrl,
        microsoftEventId: data.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in create-teams-meeting:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
