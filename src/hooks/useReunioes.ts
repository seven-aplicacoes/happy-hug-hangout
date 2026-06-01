import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Reuniao } from '@/types';

export interface MicrosoftSyncParams {
  meetingId: string;
  action?: 'create' | 'update' | 'cancel' | 'delete';
}

export interface GoogleSyncParams {
  meetingId: string;
  action?: 'create' | 'update' | 'cancel' | 'delete';
}

export function useReunioes() {
  const { user, perfil } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reunioes, isLoading, error } = useQuery({
    queryKey: ['reunioes', perfil, user?.consultorId],
    queryFn: async () => {
      let query = supabase
        .from('meetings')
        .select(`
          *,
          client:client_id (trade_name, corporate_name),
          profile:consultant_id (full_name)
        `);

      if (perfil === 'consultor' && user?.consultorId) {
        query = query.eq('consultant_id', user.consultorId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map((r: any) => ({
        id: r.id,
        clienteId: r.client_id,
        clienteNome: r.client?.trade_name || r.client?.corporate_name || 'Desconhecido',
        contratoId: r.contract_id,
        contractProductId: r.contract_product_id,
        contractProductPhaseId: r.contract_product_phase_id,
        consultorId: r.consultant_id,
        consultorNome: r.profile?.full_name || 'Desconhecido',
        meetingDate: r.meeting_date,
        data: r.meeting_date,
        startTime: r.start_time,
        hora: r.start_time,
        duracao: r.duration,
        tipo: r.type,
        title: r.title,
        pauta: r.title,
        description: r.description,
        status: r.status,
        ata: r.meeting_minutes,
        participantes: Array.isArray(r.participants) ? r.participants : [],
        source: r.source,
        externalId: r.external_id,
        meetingUrl: r.meeting_url,
        location: r.location,
        locationUrl: r.location_url,
        meetingLinkProvider: r.meeting_link_provider,
        scheduledBy: r.scheduled_by,
        contractModuleMeetingId: r.contract_module_meeting_id,
        microsoftEventId: r.microsoft_event_id,
        teamsJoinUrl: r.teams_join_url,
        teams_creation_status: r.teams_creation_status,
        teams_creation_error: r.teams_creation_error,
        microsoft_sync_status: r.microsoft_sync_status,
        microsoft_sync_error: r.microsoft_sync_error,
        microsoft_last_sync_at: r.microsoft_last_sync_at,
        sync_status: r.sync_status,
        sync_error: r.sync_error,
        meet_join_url: r.meet_join_url,
        google_event_id: r.google_event_id,
        calendar_sync_status: r.calendar_sync_status,
        calendar_sync_error: r.calendar_sync_error,
      })) as Reuniao[];
    },
  });

  const upsertReuniao = useMutation({
    mutationFn: async (reuniao: Partial<Reuniao>) => {
      const payload: any = {
        id: reuniao.id,
        client_id: reuniao.clienteId,
        contract_id: reuniao.contractId,
        contract_product_id: reuniao.contractProductId,
        contract_product_phase_id: reuniao.contractProductPhaseId,
        consultant_id: reuniao.consultorId,
        meeting_date: reuniao.meetingDate,
        start_time: reuniao.startTime,
        duration: reuniao.duracao,
        type: reuniao.tipo,
        title: reuniao.title,
        description: reuniao.description,
        status: reuniao.status,
        meeting_minutes: reuniao.ata,
        participants: reuniao.participantes,
        source: reuniao.source || 'manual',
        external_id: reuniao.externalId,
        meeting_url: reuniao.meetingUrl,
        location: reuniao.location,
        location_url: reuniao.locationUrl,
        meeting_link_provider: reuniao.meetingLinkProvider,
        scheduled_by: reuniao.scheduledBy || user?.id,
        contract_module_meeting_id: reuniao.contractModuleMeetingId,
        microsoft_event_id: reuniao.microsoftEventId,
        teams_join_url: reuniao.teamsJoinUrl,
        teams_creation_status: reuniao.teams_creation_status,
        teams_creation_error: reuniao.teams_creation_error,
        meet_join_url: reuniao.meet_join_url,
        google_event_id: reuniao.google_event_id,
      };

      if (reuniao.status === 'agendada') {
        payload.canceled_at = null;
        payload.canceled_by = null;
        payload.cancel_reason = null;
      }

      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([k, v]) => {
          if (k === 'id' && !v) return false;
          return v !== undefined;
        })
      );

      const { data: currentMeeting } = await supabase
        .from('meetings')
        .select('status, meeting_date, start_time, location_url, teams_join_url, meet_join_url, meeting_url')
        .eq('id', cleanPayload.id as string)
        .maybeSingle();

      const { data, error } = await supabase
        .from('meetings')
        .upsert({ ...cleanPayload, updated_at: new Date().toISOString(), updated_by: user?.id } as any)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Não foi possível salvar a reunião.");

      const newMeeting = data[0];

      if (currentMeeting) {
        const historyPayload: any = {
          meeting_id: newMeeting.id,
          previous_status: currentMeeting.status,
          new_status: newMeeting.status,
          changed_by: user?.id,
          action: (reuniao as any).historyAction || 'update',
          change_reason: (reuniao as any).historyReason || (newMeeting.status === 'cancelada' ? (reuniao as any).cancelReason : 'Alteração via formulário'),
        };

        if (currentMeeting.status !== newMeeting.status) {
          historyPayload.action = newMeeting.status === 'cancelada' ? 'cancel' : 'status_change';
        }

        if (currentMeeting.meeting_date !== newMeeting.meeting_date || currentMeeting.start_time !== newMeeting.start_time) {
          historyPayload.action = 'reschedule';
          historyPayload.previous_scheduled_at = currentMeeting.meeting_date ? `${currentMeeting.meeting_date}T${currentMeeting.start_time}` : null;
          historyPayload.new_scheduled_at = newMeeting.meeting_date ? `${newMeeting.meeting_date}T${newMeeting.start_time}` : null;
        }

        const currentLink = currentMeeting.teams_join_url || currentMeeting.meet_join_url || currentMeeting.location_url || currentMeeting.meeting_url;
        const newLink = newMeeting.teams_join_url || newMeeting.meet_join_url || newMeeting.location_url || newMeeting.meeting_url;
        if (currentLink !== newLink) {
          historyPayload.previous_link = currentLink;
          historyPayload.new_link = newLink;
          if (historyPayload.action === 'update') historyPayload.action = 'link_change';
        }

        await supabase.from('meeting_status_history').insert(historyPayload);
      } else {
        await supabase.from('meeting_status_history').insert({
          meeting_id: newMeeting.id,
          new_status: newMeeting.status,
          changed_by: user?.id,
          action: 'create',
          change_reason: 'Agendamento inicial',
          new_scheduled_at: newMeeting.meeting_date ? `${newMeeting.meeting_date}T${newMeeting.start_time}` : null,
          new_link: newMeeting.teams_join_url || newMeeting.meet_join_url || newMeeting.location_url || newMeeting.meeting_url
        });
      }

      if (reuniao.contractModuleMeetingId) {
        const meetingId = data[0].id;
        const status = reuniao.status === 'realizada' ? 'realizada' : (reuniao.status === 'cancelada' ? 'cancelada' : 'agendado');
        const scheduledAt = (reuniao.meetingDate && reuniao.startTime && reuniao.status !== 'cancelada')
          ? `${reuniao.meetingDate}T${reuniao.startTime}` 
          : null;

        await supabase
          .from('contract_module_meetings')
          .update({
            status,
            scheduled_meeting_id: meetingId,
            scheduled_at: scheduledAt,
            consultant_id: reuniao.consultorId,
            completed_at: reuniao.status === 'realizada' ? new Date().toISOString() : null,
            teams_join_url: reuniao.teamsJoinUrl,
            meet_join_url: (reuniao as any).meet_join_url || newMeeting.meet_join_url,
            microsoft_event_id: reuniao.microsoftEventId,
            google_event_id: (reuniao as any).google_event_id || newMeeting.google_event_id,
            meeting_link_provider: reuniao.meetingLinkProvider as any,
            location_url: reuniao.locationUrl || newMeeting.location_url
          } as any)
          .eq('id', reuniao.contractModuleMeetingId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunioes'] });
      queryClient.invalidateQueries({ queryKey: ['contract-module-meetings'] });
      toast({ title: 'Sucesso', description: 'Reunião salva com sucesso.' });
    },
  });

  const deleteReuniao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meetings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunioes'] });
      toast({ title: 'Sucesso', description: 'Reunião removida.' });
    },
  });

  const syncMicrosoft = useMutation({
    mutationFn: async ({ meetingId, action }: MicrosoftSyncParams) => {
      const { data, error } = await supabase.functions.invoke('create-teams-meeting', {
        body: { meetingId, action }
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'Erro na sincronização Microsoft');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunioes'] });
    }
  });

  const syncGoogle = useMutation({
    mutationFn: async ({ meetingId, action }: GoogleSyncParams) => {
      console.log(`Chamando Edge Function create-google-meet-meeting [${action}]`, {
        meeting_id: meetingId
      });

      const { data, error } = await supabase.functions.invoke('create-google-meet-meeting', {
        body: { meeting_id: meetingId, action }
      });

      if (error) {
        console.error("Erro ao chamar Edge Function:", error);
        throw new Error(error.message || "Erro de rede ao chamar Edge Function");
      }

      if (data?.success === false) {
        console.error("Erro retornado pela Edge Function:", data);
        throw new Error(data?.error || "Falha ao sincronizar com Google");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunioes'] });
    }
  });

  const testMicrosoftConnection = async () => {
    const { data, error } = await supabase.functions.invoke('create-teams-meeting', {
      body: { action: 'test_connection' }
    });
    return data;
  };

  const testMicrosoftCalendar = async () => {
    const { data, error } = await supabase.functions.invoke('create-teams-meeting', {
      body: { action: 'test_calendar' }
    });
    return data;
  };

  return { 
    reunioes, 
    isLoading, 
    error, 
    upsertReuniao, 
    deleteReuniao, 
    syncMicrosoft,
    syncGoogle,
    testMicrosoftConnection,
    testMicrosoftCalendar
  };
}
