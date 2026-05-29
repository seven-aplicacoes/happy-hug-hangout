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
          meetings:meetings(count),
          methodology_phase:methodology_plan_phases (
            duration_minutes,
            meetings_count,
            executor_type,
            name
          )
        `)
        .eq('contract_product_id', contractProductId)
        .order('order_index');

      if (error) throw error;

      return (data || []).map((p: any) => {
        const meetingsScheduled = p.meetings?.[0]?.count || 0;
        const methodology = p.methodology_phase || {};

        return {
          id: p.id,
          contractProductId: p.contract_product_id,
          methodologyPhaseId: p.methodology_phase_id,
          orderIndex: p.order_index,
          name: p.name || methodology.name,
          durationMinutes: p.duration_minutes !== null && p.duration_minutes !== undefined ? p.duration_minutes : (methodology.duration_minutes || 0),
          executorType: p.executor_type || methodology.executor_type,
          meetingsCount: p.meetings_count !== null && p.meetings_count !== undefined && p.meetings_count !== 0 ? p.meetings_count : (methodology.meetings_count || 0),
          startDate: p.start_date,
          endDate: p.end_date,
          status: p.status,
          responsibleConsultantId: p.responsible_consultant_id,
          responsibleConsultantNome: p.responsible_consultant?.full_name,
          internalNotes: p.internal_notes,
          clientNotes: p.client_notes,
          clientVisible: p.client_visible,
          meetingsScheduled,
        };
      }) as (ContractProductPhase & { responsibleConsultantNome?: string; meetingsScheduled?: number })[];
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
          duration_minutes: item.durationMinutes,
          executor_type: item.executorType,
          meetings_count: item.meetingsCount,
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
