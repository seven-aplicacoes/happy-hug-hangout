import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ContractModuleMeeting } from '@/types';

export function useContractModuleMeetings(moduleId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: meetings, isLoading: queryLoading, error } = useQuery({
    queryKey: ['contract-module-meetings', moduleId],
    queryFn: async () => {
      if (!moduleId) return [];
      const { data, error } = await supabase
        .from('contract_module_meetings')
        .select(`
          *,
          consultant:profiles!consultant_id (full_name),
          module:contract_product_phases!module_id (
            responsible_consultant_id,
            contract_product:client_products!contract_product_id (
              consultant_id,
              client:clients!client_id (consultant_id)
            )
          )
        `)
        .eq('module_id', moduleId)
        .order('order_index');

      if (error) throw error;

      return (data || []).map((m: any) => {
        const inheritedConsultantId = 
          m.consultant_id || 
          m.module?.responsible_consultant_id || 
          m.module?.contract_product?.consultant_id || 
          m.module?.contract_product?.client?.consultant_id;

        return {
          id: m.id,
          contractId: m.contract_id,
          clientId: m.client_id,
          productId: m.product_id,
          moduleId: m.module_id,
          meetingNumber: m.meeting_number,
          title: m.title,
          status: m.status,
          scheduledMeetingId: m.scheduled_meeting_id,
          consultantId: inheritedConsultantId,
          scheduledAt: m.scheduled_at,
          completedAt: m.completed_at,
          orderIndex: m.order_index,
          consultantName: m.consultant?.full_name || 'Herdeiro', // Ideally fetch name for inherited
        };
      }) as ContractModuleMeeting[];
    },
    enabled: !!moduleId,
  });

  const updateMeeting = useMutation({
    mutationFn: async (meeting: Partial<ContractModuleMeeting>) => {
      const { data, error } = await supabase
        .from('contract_module_meetings')
        .update({
          status: meeting.status,
          scheduled_meeting_id: meeting.scheduledMeetingId,
          consultant_id: meeting.consultantId,
          scheduled_at: meeting.scheduledAt,
          completed_at: meeting.completedAt,
          title: meeting.title,
        })
        .eq('id', meeting.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-module-meetings', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['contract-product-phases'] });
    },
  });

  const isLoading = queryLoading && !!moduleId;

  return { meetings, isLoading, error, updateMeeting };

}
