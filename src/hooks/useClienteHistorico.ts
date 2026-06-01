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
      
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });

      if (error) throw error;

      return data.map((e: any) => ({
        id: e.id,
        data: e.date,
        tipo: e.type as any,
        titulo: e.title,
        descricao: e.description,
        ia_summary: e.ia_summary,
        ia_status: e.ia_status,
        fase: e.phase,
        evidencias: e.evidence_urls || [],
        meeting_id: e.meeting_id,
        status: e.status,
      }));
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
