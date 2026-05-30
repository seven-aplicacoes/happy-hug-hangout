import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ContractProductPhase } from '@/types';

export function useContractProductPhases(contractProductId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: phases, isLoading: queryLoading, error } = useQuery({
    queryKey: ['contract-product-phases', contractProductId],
    queryFn: async () => {
      if (!contractProductId) return [];

      const { data, error } = await supabase
        .from('contract_product_phases')
        .select(`
          *,
          responsible_consultant:profiles!contract_product_phases_responsible_consultant_id_fkey (full_name),
          meetings:contract_module_meetings(count),
          scheduled:contract_module_meetings(count).filter('status', 'eq', 'agendado'),
          realized:contract_module_meetings(count).filter('status', 'eq', 'realizada'),
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
          name: p.name || methodology.name || 'Módulo Removido', // Snapshot prioritized
          durationMinutes: p.duration_minutes ?? methodology.duration_minutes ?? 0,
          executorType: p.executor_type || methodology.executor_type,
          meetingsCount: p.meetings_count ?? methodology.meetings_count ?? 0,
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

      const { data: savedPhases, error } = await supabase
        .from('contract_product_phases')
        .upsert(payload)
        .select(`
          id,
          contract_product_id,
          meetings_count,
          responsible_consultant_id,
          name,
          contract_products (
            contract_id,
            contracts (
              cliente_id
            )
          )
        `);

      if (error) throw error;

      // Sincroniza o responsável e cria encontros se necessário
      for (const phase of savedPhases as any[]) {
        if (phase.id) {
          // 1. Check existing meetings
          const { count: existingCount } = await supabase
            .from('contract_module_meetings')
            .select('*', { count: 'exact', head: true })
            .eq('module_id', phase.id);

          const targetCount = phase.meetings_count || 0;
          
          if (targetCount > (existingCount || 0)) {
            // Need to create missing meetings
            const diff = targetCount - (existingCount || 0);
            const newMeetings = [];
            
            for (let i = 1; i <= diff; i++) {
              const meetingNumber = (existingCount || 0) + i;
              newMeetings.push({
                module_id: phase.id,
                product_id: phase.contract_product_id,
                contract_id: phase.contract_products?.contract_id,
                client_id: phase.contract_products?.contracts?.cliente_id,
                meeting_number: meetingNumber,
                title: `${phase.name} - Encontro ${meetingNumber}`,
                status: 'pendente',
                consultant_id: phase.responsible_consultant_id,
                order_index: meetingNumber
              });
            }
            
            if (newMeetings.length > 0) {
              await supabase.from('contract_module_meetings').insert(newMeetings);
            }
          }

          // 2. Sync consultant for existing meetings
          if (phase.responsible_consultant_id) {
            // Atualiza encontros pendentes ou agendados para o novo consultor
            await supabase
              .from('contract_module_meetings')
              .update({ consultant_id: phase.responsible_consultant_id })
              .eq('module_id', phase.id)
              .in('status', ['pendente', 'agendado']);
              
            // Atualiza reuniões agendadas vinculadas
            const { data: meetingsToUpdate } = await supabase
              .from('contract_module_meetings')
              .select('scheduled_meeting_id')
              .eq('module_id', phase.id)
              .eq('status', 'agendado')
              .not('scheduled_meeting_id', 'is', null);

            if (meetingsToUpdate && meetingsToUpdate.length > 0) {
              const meetingIds = meetingsToUpdate.map(m => m.scheduled_meeting_id).filter(Boolean);
              if (meetingIds.length > 0) {
                await supabase
                  .from('meetings')
                  .update({ consultant_id: phase.responsible_consultant_id })
                  .in('id', meetingIds);
              }
            }
          }
        }
      }

      return savedPhases;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-product-phases'] });
      queryClient.invalidateQueries({ queryKey: ['contract-module-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['reunioes'] });
      queryClient.invalidateQueries({ queryKey: ['contract-products'] });
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

  const isLoading = queryLoading && !!contractProductId;

  return { phases, isLoading, error, upsertPhases, deletePhase };
}
