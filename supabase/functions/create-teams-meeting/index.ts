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

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro de configuração do sistema.',
          details: 'LOVABLE_API_KEY is not configured',
          step: 'auth'
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!teamsApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'O Microsoft Teams não está conectado ou a conexão expirou.',
          details: 'MICROSOFT_TEAMS_API_KEY is not configured (Microsoft Teams connector not linked)',
          step: 'auth'
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

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

    // Validation
    if (action !== 'cancel' && action !== 'delete') {
      if (!title) return new Response(JSON.stringify({ success: false, error: 'Título da reunião não informado.', step: 'payload_validation' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      if (!startDateTime) return new Response(JSON.stringify({ success: false, error: 'Data e horário de início não informados.', step: 'payload_validation' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      if (!endDateTime) return new Response(JSON.stringify({ success: false, error: 'Data e horário de término não informados.', step: 'payload_validation' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    const headers = {
      'Authorization': `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': teamsApiKey,
      'Content-Type': 'application/json',
    }

    let response;
    let method = 'POST';
    let url = `${GATEWAY_URL}/me/events`;

    if (action === 'cancel' || action === 'delete') {
      if (!microsoftEventId) {
        return new Response(
          JSON.stringify({ success: false, error: 'ID do evento Microsoft não informado para cancelamento.', step: 'payload_validation' }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
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
          content: description || '',
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
              name: a.name || a.email,
            },
            type: 'required',
          })),
        isOnlineMeeting: true,
        onlineMeetingProvider: 'teamsForBusiness',
      };

      try {
        response = await fetch(url, {
          method,
          headers,
          body: JSON.stringify(eventBody)
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Falha na comunicação com o Microsoft Graph.',
            details: err instanceof Error ? err.message : String(err),
            step: 'microsoft_graph_request'
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
        );
      }
    }

    const rawText = await response!.text()
    let data: any = null
    try {
      data = rawText ? JSON.parse(rawText) : null
    } catch {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Resposta inválida do servidor Microsoft.',
          details: `Gateway returned ${response!.status}: ${rawText.slice(0, 200)}`,
          step: 'microsoft_graph_response'
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }

    if (!response!.ok || data?.error) {
      console.error('Gateway error:', response!.status, data)
      const message = data?.error?.message || data?.message || `Status ${response!.status}`
      
      // Check for specific permission errors
      let errorLabel = 'Não foi possível criar a reunião no Microsoft Teams.';
      if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('access denied')) {
        errorLabel = 'O Microsoft Teams está conectado, mas a conexão atual não possui permissão para criar eventos de calendário. Conecte o Outlook/Calendar ou reconecte aceitando permissões de calendário.';
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorLabel,
          details: message,
          step: 'microsoft_graph_response'
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response!.status }
      )
    }

    const teamsJoinUrl = data?.onlineMeeting?.joinUrl || data?.onlineMeetingUrl || data?.webLink || data?.joinUrl || data?.joinWebUrl;

    return new Response(
      JSON.stringify({
        success: true,
        teamsJoinUrl,
        microsoftEventId: data?.id,
        rawResponse: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in teams-meeting function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Ocorreu um erro inesperado ao processar a reunião.',
        details: error instanceof Error ? error.message : String(error),
        step: 'unknown'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
