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
    const { title, description, startDateTime, endDateTime, attendees } = await req.json()
    const apiKey = Deno.env.get('MICROSOFT_TEAMS_API_KEY')

    if (!apiKey) {
      throw new Error('Microsoft Teams Connector not linked or API Key missing.')
    }

    // Call Lovable Connector Gateway for Microsoft Teams
    // The gateway endpoint is available via the connector API key
    // We use the Microsoft Graph API structure via the gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/connectors/microsoft_teams/me/onlineMeetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: title,
        startDateTime,
        endDateTime,
        description: description,
        lobbyDeclaration: {
          participantWhoCanBypassLobby: "everyone"
        }
      })
    })

    const data = await response.json()
    
    if (data.error) {
      console.error('Connector Error:', data.error)
      throw new Error(data.error.message || 'Failed to create Teams meeting via connector')
    }

    if (!data.joinWebUrl) {
      console.error('Unexpected Response:', data)
      throw new Error('Meeting created but no join URL returned')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        teamsJoinUrl: data.joinWebUrl, 
        microsoftEventId: data.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in create-teams-meeting:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
