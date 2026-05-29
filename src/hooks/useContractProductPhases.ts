import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ContractProductPhase } from '@/types';

export function useContractProductPhases(contractProductId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: phases, isLoading, error } = useQuery({
    queryKey: ['contract-product-phases', contractProductId],
    queryFn: async () => {
      if (!contractProductId) return [];
      const { data, error } = await supabase
        .from('contract_product_phases')
        .select(`
          *,
          responsible_consultant:profiles!contract_product_phases_responsible_consultant_id_fkey (full_name),
          meetings:meetings(count)
        `)
        .eq('contract_product_id', contractProductId)
        .order('order_index');

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        contractProductId: p.contract_product_id,
        methodologyPhaseId: p.methodology_phase_id,
        orderIndex: p.order_index,
        name: p.name,
        durationMinutes: p.duration_minutes,
        executorType: p.executor_type,
        meetingsCount: p.meetings_count,
        meetingsScheduled: p.meetings?.[0]?.count || 0,
        startDate: p.start_date,
        endDate: p.end_date,
        status: p.status,
        responsibleConsultantId: p.responsible_consultant_id,
        responsibleConsultantNome: p.responsible_consultant?.full_name,
        internalNotes: p.internal_notes,
        clientNotes: p.client_notes,
        clientVisible: p.client_visible,
        meetingsScheduled: p.meetingsScheduled,
      })) as (ContractProductPhase & { responsibleConsultantNome?: string; meetingsScheduled?: number })[];
    },
    enabled: !!contractProductId,
  });

  const upsertPhases = useMutation({
    mutationFn: async (items: Partial<ContractProductPhase>[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = items.map(item => {
        const p: any = {
          contract_product_id: item.contractProductId,
          methodology_phase_id: item.methodologyPhaseId,
          order_index: item.orderIndex,
          name: item.name,
          duration_minutes: item.duration_minutes,
          executor_type: item.executor_type,
          meetings_count: item.meetings_count,
          start_date: item.startDate,
          end_date: item.endDate,
          status: item.status || 'pendente',
          responsible_consultant_id: item.responsibleConsultantId,
          internal_notes: item.internalNotes,
          client_notes: item.clientNotes,
          client_visible: item.clientVisible !== undefined ? item.clientVisible : true,
          updated_by: user?.id,
        };

        if (item.id && typeof item.id === 'string' && item.id.length > 10) {
          p.id = item.id;
        } else {
          p.created_by = user?.id;
        }

        return p;
      });

      const { data, error } = await supabase
        .from('contract_product_phases')
        .upsert(payload)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-product-phases', contractProductId] });
    },
  });

  const deletePhase = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contract_product_phases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-product-phases', contractProductId] });
    },
  });

  return { phases, isLoading, error, upsertPhases, deletePhase };
}
