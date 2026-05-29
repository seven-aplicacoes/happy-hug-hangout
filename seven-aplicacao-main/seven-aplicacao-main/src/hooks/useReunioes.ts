import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Reuniao } from '@/types';

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
        scheduledBy: r.scheduled_by,
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
        scheduled_by: reuniao.scheduledBy || user?.id,
      };

      // Filter out undefined values to avoid overwriting with null if not intended
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== undefined)
      );

      const { data, error } = await supabase
        .from('meetings')
        .upsert(cleanPayload as any)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunioes'] });
      toast({ title: 'Sucesso', description: 'Reunião salva com sucesso.' });
    },
    onError: (error: any) => {
      console.error('Erro ao salvar reunião:', error);
      toast({ 
        title: 'Erro ao salvar', 
        description: error.message || 'Ocorreu um erro ao tentar salvar a reunião. Verifique os dados e tente novamente.',
        variant: 'destructive'
      });
    }
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

  return { reunioes, isLoading, error, upsertReuniao, deleteReuniao };
}
