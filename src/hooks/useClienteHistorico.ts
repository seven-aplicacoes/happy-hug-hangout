import { getFriendlyError } from '@/lib/friendlyErrors';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { TimelineEvent } from '@/types';

export function useClienteHistorico(clientId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: historico, isLoading: queryLoading, error } = useQuery({
    queryKey: ['cliente-historico', clientId],
    queryFn: async () => {
      if (!clientId) return [] as TimelineEvent[];
      
      // Fetch timeline events
      const { data: timelineData, error: timelineError } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });

      if (timelineError) throw timelineError;

      // Fetch completed/cancelled meetings
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select(`
          id,
          title,
          description,
          meeting_date,
          status,
          consultant_id,
          type,
          teams_join_url,
          location_url,
          meeting_url,
          meeting_link_provider,
          profile:consultant_id (full_name)
        `)
        .eq('client_id', clientId)
        .in('status', ['concluido', 'concluído', 'realizado', 'realizada', 'completed', 'done', 'cancelado', 'cancelada', 'no_show'])
        .order('meeting_date', { ascending: false });

      if (meetingsError) throw meetingsError;

      const events: TimelineEvent[] = timelineData.map((e: any) => ({
        id: e.id,
        data: e.date,
        tipo: e.type as any,
        titulo: e.title,
        descricao: e.description,
        resumoIA: e.ia_summary,
        statusResumo: e.ia_status,
        faseRelacionada: e.phase,
        evidencias: e.evidence_urls || [],
        meeting_id: e.meeting_id,
        status: e.status,
      }));

      const meetingEvents: TimelineEvent[] = (meetingsData || []).map((m: any) => ({
        id: `meeting-${m.id}`,
        data: m.meeting_date,
        tipo: 'reuniao' as const,
        titulo: m.title,
        descricao: m.description || '',
        meeting_id: m.id,
        status: m.status,
        consultant_name: m.profile?.full_name,
        meeting_link: m.teams_join_url || m.meeting_url || m.location_url,
        meeting_link_provider: m.meeting_link_provider
      }));

      // Merge and sort by date descending
      const allEvents = [...events, ...meetingEvents].sort((a, b) => 
        new Date(b.data).getTime() - new Date(a.data).getTime()
      );

      // Remove duplicates (if a meeting has both a timeline event and is in meetings query)
      const uniqueEvents = allEvents.filter((event, index, self) =>
        index === self.findIndex((t) => (
          (t.meeting_id && event.meeting_id && t.meeting_id === event.meeting_id) || (t.id === event.id)
        ))
      );

      return uniqueEvents;
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
        phase: evento.faseRelacionada || null,
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
      toast({ title: 'Erro ao registrar histórico', description: getFriendlyError(error).description, variant: 'destructive' });
    },
  });

  const isLoading = queryLoading && !!clientId;

  return { historico, isLoading, error, addEvento };

}