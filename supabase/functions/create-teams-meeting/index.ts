import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, description, startDateTime, endDateTime, attendees, meetingId } = await req.json()

    // Retrieve Microsoft credentials from env vars
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID')
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET')
    const tenantId = Deno.env.get('MICROSOFT_TENANT_ID')

    if (!clientId || !clientSecret || !tenantId) {
      throw new Error('Microsoft integration not configured in environment variables.')
    }

    // 1. Get Access Token (Client Credentials Flow - assuming Application permissions for simplicity in this scaffold)
    // Note: For business use, typically a delegated flow or a specific service account is better.
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'https://graph.microsoft.com/.default'
      })
    })

    const tokenData = await tokenResponse.json()
    if (!tokenData.access_token) {
      throw new Error('Failed to obtain Microsoft Graph access token')
    }

    const accessToken = tokenData.access_token

    // 2. Create Online Meeting
    const meetingResponse = await fetch(`https://graph.microsoft.com/v1.0/me/onlineMeetings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: title,
        startDateTime,
        endDateTime,
        lobbyDeclaration: {
          isReviewAllowed: true,
          participantWhoCanBypassLobby: "everyone"
        }
      })
    })

    const meetingData = await meetingResponse.json()
    
    if (!meetingData.joinWebUrl) {
      console.error('Graph API Error:', meetingData)
      throw new Error('Failed to create Microsoft Teams meeting')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        teamsJoinUrl: meetingData.joinWebUrl, 
        eventId: meetingData.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
