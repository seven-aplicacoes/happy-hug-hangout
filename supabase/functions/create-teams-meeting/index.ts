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

  console.log('[create-teams-meeting] Function started');

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    const teamsApiKey = Deno.env.get('MICROSOFT_TEAMS_API_KEY')

    if (!lovableApiKey) {
      console.error('[create-teams-meeting] LOVABLE_API_KEY is not configured');
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
      console.error('[create-teams-meeting] MICROSOFT_TEAMS_API_KEY is not configured');
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
    console.log('[create-teams-meeting] Parsed payload:', JSON.stringify(body, null, 2));

    const { 
      action, // 'create', 'update', 'cancel'
      title, 
      description, 
      startDateTime, 
      endDateTime, 
      attendees,
      microsoftEventId,
      timezone = 'America/Fortaleza'
    } = body

    // Validation
    console.log('[create-teams-meeting] Validating payload for action:', action);
    if (action !== 'cancel' && action !== 'delete') {
      if (!title) {
        console.error('[create-teams-meeting] Missing title');
        return new Response(JSON.stringify({ success: false, error: 'Título da reunião não informado.', step: 'payload_validation' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      }
      if (!startDateTime) {
        console.error('[create-teams-meeting] Missing startDateTime');
        return new Response(JSON.stringify({ success: false, error: 'Data e horário de início não informados.', step: 'payload_validation' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      }
      if (!endDateTime) {
        console.error('[create-teams-meeting] Missing endDateTime');
        return new Response(JSON.stringify({ success: false, error: 'Data e horário de término não informados.', step: 'payload_validation' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      }
    }

    const headers = {
      'Authorization': `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': teamsApiKey,
      'Content-Type': 'application/json',
    }

    let response;
    let method = 'POST';
    let url = `${GATEWAY_URL}/v1.0/me/events`; // Updated to typical Graph structure if gateway maps it

    if (action === 'cancel' || action === 'delete') {
      if (!microsoftEventId) {
        console.error('[create-teams-meeting] Missing microsoftEventId for cancellation');
        return new Response(
          JSON.stringify({ success: false, error: 'ID do evento Microsoft não informado para cancelamento.', step: 'payload_validation' }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      console.log('[create-teams-meeting] Cancelling event:', microsoftEventId);
      response = await fetch(`${GATEWAY_URL}/v1.0/me/events/${microsoftEventId}`, {
        method: 'DELETE',
        headers
      });
      
      if (response.status === 204) {
        console.log('[create-teams-meeting] Event cancelled successfully');
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else if (action === 'update' && microsoftEventId) {
      method = 'PATCH';
      url = `${GATEWAY_URL}/v1.0/me/events/${microsoftEventId}`;
      console.log('[create-teams-meeting] Updating event:', microsoftEventId);
    }

    if (action !== 'cancel' && action !== 'delete') {
      const eventBody = {
        subject: title,
        body: {
          contentType: 'HTML',
          content: description || 'Reunião agendada pelo sistema SEVEN.',
        },
        start: {
          dateTime: startDateTime,
          timeZone: timezone,
        },
        end: {
          dateTime: endDateTime,
          timeZone: timezone,
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

      console.log('[create-teams-meeting] Calling Microsoft Graph at:', url);
      console.log('[create-teams-meeting] Graph payload:', JSON.stringify(eventBody, null, 2));

      try {
        response = await fetch(url, {
          method,
          headers,
          body: JSON.stringify(eventBody)
        });
      } catch (err) {
        console.error('[create-teams-meeting] Fetch error:', err);
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
    console.log('[create-teams-meeting] Microsoft Graph response status:', response!.status);
    console.log('[create-teams-meeting] Microsoft Graph raw response:', rawText.slice(0, 1000));

    let data: any = null
    try {
      data = rawText ? JSON.parse(rawText) : null
    } catch {
      console.error('[create-teams-meeting] Failed to parse JSON response');
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
      console.error('[create-teams-meeting] Microsoft Graph returned error:', data);
      const message = data?.error?.message || data?.message || `Status ${response!.status}`
      
      let errorLabel = 'Não foi possível criar a reunião no Microsoft Teams.';
      if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('access denied')) {
        errorLabel = 'O Microsoft Teams está conectado, mas a conexão atual não possui permissão para criar eventos de calendário. Conecte o Outlook/Calendar ou reconecte aceitando permissões de calendário.';
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorLabel,
          details: message,
          step: 'microsoft_graph_response',
          graphResponse: data
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response!.status }
      )
    }

    const teamsJoinUrl = data?.onlineMeeting?.joinUrl || 
                         data?.onlineMeetingUrl || 
                         data?.joinUrl || 
                         data?.joinWebUrl || 
                         (data?.onlineMeeting && data.onlineMeeting.joinUrl) ||
                         data?.webLink;

    console.log('[create-teams-meeting] Extracted joinUrl:', teamsJoinUrl);
    console.log('[create-teams-meeting] Extracted eventId:', data?.id);

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
    console.error('[create-teams-meeting] Global error:', error)
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
