import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { TimelineEvent } from '@/types';

export function useClienteHistorico(clientId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: historico, isLoading: queryLoading, error } = useQuery({
    queryKey: ['cliente-historico', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data: timelineEvents, error: timelineError } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('client_id', clientId);

      if (timelineError) throw timelineError;

      const { data: meetings, error: meetingsError } = await supabase
        .from('contract_module_meetings')
        .select(`
          *,
          consultant:profiles!consultant_id (full_name)
        `)
        .eq('client_id', clientId)
        .not('scheduled_at', 'is', null);

      if (meetingsError) throw meetingsError;

      const { data: schedulingEvents, error: schedulingError } = await supabase
        .from('meeting_scheduling_events' as any)
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (schedulingError) throw schedulingError;

      const meetingEvents = meetings.map((m: any) => ({
        id: m.id,
        data: m.scheduled_at,
        tipo: 'reuniao' as any,
        titulo: m.title,
        descricao: `Encontro agendado com ${m.consultant?.full_name || 'consultor'}. Status: ${m.status}`,
        fase: m.module_id,
        evidencias: [],
      }));

      const schedulingHistory = (schedulingEvents || []).map((se: any) => ({
        id: se.id,
        data: se.canceled_at || se.scheduled_start_time || se.created_at,
        tipo: 'reuniao' as any,
        titulo: se.event_name || 'Agendamento Calendly',
        descricao: se.status === 'canceled' 
          ? `Agendamento cancelado: ${se.cancellation_reason || 'sem motivo informado'}`
          : se.status === 'rescheduled'
          ? `Agendamento reagendado.`
          : `Reunião agendada para ${new Date(se.scheduled_start_time).toLocaleString('pt-BR')}`,
        fase: se.module_id,
        evidencias: [],
      }));


      const allEvents = [
        ...timelineEvents.map((e: any) => ({
          id: e.id,
          data: e.date,
          tipo: e.type as any,
          titulo: e.title,
          descricao: e.description,
          ia_summary: e.ia_summary,
          ia_status: e.ia_status,
          fase: e.phase,
          evidencias: e.evidence_urls || [],
        })),
        ...meetingEvents
      ];

      return allEvents.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    },
    enabled: !!clientId,
  });

  const addEvento = useMutation({
    mutationFn: async (evento: Partial<TimelineEvent>) => {
      const payload: any = {
        client_id: clientId,
        type: evento.tipo,
        title: evento.titulo,
        description: evento.descricao,
        date: evento.data || new Date().toISOString(),
        ia_summary: evento.resumoIA,
        ia_status: evento.statusResumo,
        phase: (evento.faseRelacionada as any) || null,
        evidence_urls: evento.evidencias,
      };

      const { data, error } = await supabase
        .from('timeline_events')
        .insert(payload)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-historico', clientId] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao registrar histórico', description: error.message, variant: 'destructive' });
    },
  });

  const isLoading = queryLoading && !!clientId;

  return { historico, isLoading, error, addEvento };

}