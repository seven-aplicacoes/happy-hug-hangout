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
          consultant:profiles!consultant_id (full_name)
        `)
        .eq('module_id', moduleId)
        .order('order_index');

      if (error) throw error;

      return (data || []).map((m: any) => ({
        id: m.id,
        contractId: m.contract_id,
        clientId: m.client_id,
        productId: m.product_id,
        moduleId: m.module_id,
        meetingNumber: m.meeting_number,
        title: m.title,
        status: m.status,
        scheduledMeetingId: m.scheduled_meeting_id,
        consultantId: m.consultant_id,
        scheduledAt: m.scheduled_at,
        completedAt: m.completed_at,
        orderIndex: m.order_index,
        consultantName: m.consultant?.full_name,
      })) as ContractModuleMeeting[];
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
