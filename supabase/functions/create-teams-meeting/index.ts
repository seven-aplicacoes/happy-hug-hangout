import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/microsoft_teams/v1.0'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    const teamsApiKey = Deno.env.get('MICROSOFT_TEAMS_API_KEY')

    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY is not configured')
    if (!teamsApiKey) throw new Error('MICROSOFT_TEAMS_API_KEY is not configured (Microsoft Teams connector not linked)')

    const body = await req.json()
    const { 
      action, // 'create', 'update', 'cancel'
      title, 
      description, 
      startDateTime, 
      endDateTime, 
      attendees,
      microsoftEventId 
    } = body

    const headers = {
      'Authorization': `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': teamsApiKey,
      'Content-Type': 'application/json',
    }

    // Default to America/Fortaleza if not provided in ISO string
    // Note: Graph API expects ISO strings. We'll pass them directly.
    
    let response;
    let method = 'POST';
    let url = `${GATEWAY_URL}/me/events`;

    if (action === 'cancel' || action === 'delete') {
      if (!microsoftEventId) throw new Error('microsoftEventId is required for cancellation');
      response = await fetch(`${GATEWAY_URL}/me/events/${microsoftEventId}`, {
        method: 'DELETE',
        headers
      });
      
      if (response.status === 204) {
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else if (action === 'update' && microsoftEventId) {
      method = 'PATCH';
      url = `${GATEWAY_URL}/me/events/${microsoftEventId}`;
    }

    if (action !== 'cancel' && action !== 'delete') {
      const eventBody = {
        subject: title,
        body: {
          contentType: 'HTML',
          content: description,
        },
        start: {
          dateTime: startDateTime,
          timeZone: 'America/Fortaleza',
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'America/Fortaleza',
        },
        location: {
          displayName: 'Microsoft Teams Meeting',
        },
        attendees: (attendees || [])
          .filter((a: any) => a.email)
          .map((a: any) => ({
            emailAddress: {
              address: a.email,
              name: a.name,
            },
            type: 'required',
          })),
        isOnlineMeeting: true,
        onlineMeetingProvider: 'teamsForBusiness',
      };

      response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(eventBody)
      });
    }

    const rawText = await response!.text()
    let data: any = null
    try {
      data = rawText ? JSON.parse(rawText) : null
    } catch {
      console.error('Non-JSON response from gateway:', response!.status, rawText)
      throw new Error(`Gateway returned ${response!.status}: ${rawText.slice(0, 200)}`)
    }

    if (!response!.ok || data?.error) {
      console.error('Gateway error:', response!.status, data)
      const message = data?.error?.message || data?.message || `Status ${response!.status}`
      throw new Error(message)
    }

    return new Response(
      JSON.stringify({
        success: true,
        teamsJoinUrl: data?.onlineMeeting?.joinUrl || data?.onlineMeetingUrl || data?.webLink || data?.joinUrl,
        microsoftEventId: data?.id,
        rawResponse: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in teams-meeting function:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
