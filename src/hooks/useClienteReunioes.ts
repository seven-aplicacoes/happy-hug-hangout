import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Reuniao } from '@/types';

export function useClienteReunioes(clientId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reunioes, isLoading, error } = useQuery({
    queryKey: ['reunioes', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          profile:consultant_id (full_name),
          client:client_id (trade_name)
        `)
        .eq('client_id', clientId)
        .order('meeting_date', { ascending: false });

      if (error) throw error;

      return (data || []).map((r: any) => ({
        id: r.id,
        clienteId: r.client_id,
        clienteNome: r.client?.trade_name || 'N/A',
        contractId: r.contract_id,
        contractProductId: r.contract_product_id,
        contractProductPhaseId: r.contract_product_phase_id,
        consultorId: r.consultant_id,
        consultorNome: r.profile?.full_name || 'N/A',
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
    enabled: !!clientId,
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
        scheduled_by: reuniao.scheduledBy,
      };

      const { data, error } = await supabase
        .from('meetings')
        .upsert(payload)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunioes', clientId] });
      toast({ title: 'Sucesso', description: 'Reunião salva com sucesso.' });
    },
  });

  return { reunioes, isLoading, error, upsertReuniao };
}
