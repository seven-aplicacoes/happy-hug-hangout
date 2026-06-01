import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ConsultantAvailability, ConsultantAvailableSlot } from '@/types';

export function useConsultantAvailability(filters: {
  clientId?: string;
  contractId?: string;
  contractProductId?: string;
  contractPhaseId?: string;
  consultantId?: string;
  contractModuleMeetingId?: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: availabilities, isLoading: isLoadingRules } = useQuery({
    queryKey: ['consultant-availability', filters, 'realtime'],
    staleTime: 0,
    refetchOnMount: true,
    queryFn: async () => {
      console.log("[CLIENT_PORTAL_AVAILABILITY_START]", filters);
      let query = supabase.from('consultant_availability').select('*');
      
      if (filters.clientId) query = query.eq('client_id', filters.clientId);
      if (filters.contractId) query = query.eq('contract_id', filters.contractId);
      if (filters.contractProductId) query = query.eq('contract_product_id', filters.contractProductId);
      if (filters.contractPhaseId) query = query.eq('contract_phase_id', filters.contractPhaseId);
      
      if (filters.consultantId && filters.contractModuleMeetingId) {
        query = query.eq('consultant_id', filters.consultantId)
          .or(`contract_module_meeting_id.eq.${filters.contractModuleMeetingId},contract_module_meeting_id.is.null`);
      } else {
        if (filters.consultantId) query = query.eq('consultant_id', filters.consultantId);
        if (filters.contractModuleMeetingId) query = query.eq('contract_module_meeting_id', filters.contractModuleMeetingId);
      }

      const { data, error } = await query;
      if (error) {
        console.error("[GET_AVAILABILITY_ERROR]", error);
        throw error;
      }
      console.log("[CLIENT_PORTAL_AVAILABILITY_QUERY_RESULT]", {
        consultantId: filters.consultantId,
        availabilityCount: data?.length || 0,
        availability: data
      });
      return data as ConsultantAvailability[];
    },
    enabled: !!(filters.consultantId || filters.contractPhaseId),
  });

  const { data: slots, isLoading: isLoadingSlots } = useQuery({
    queryKey: ['consultant-slots', filters, 'realtime'],
    staleTime: 0,
    refetchOnMount: true,
    queryFn: async () => {
      let query = supabase.from('consultant_available_slots').select('*');
      
      if (filters.clientId) query = query.eq('client_id', filters.clientId);
      if (filters.contractId) query = query.eq('contract_id', filters.contractId);
      if (filters.contractProductId) query = query.eq('contract_product_id', filters.contractProductId);
      if (filters.contractPhaseId) query = query.eq('contract_phase_id', filters.contractPhaseId);

      if (filters.consultantId && filters.contractModuleMeetingId) {
        query = query.eq('consultant_id', filters.consultantId)
          .or(`contract_module_meeting_id.eq.${filters.contractModuleMeetingId},contract_module_meeting_id.is.null`);
      } else {
        if (filters.consultantId) query = query.eq('consultant_id', filters.consultantId);
        if (filters.contractModuleMeetingId) query = query.eq('contract_module_meeting_id', filters.contractModuleMeetingId);
      }

      const { data, error } = await query.order('available_date').order('start_time');
      if (error) {
        console.error("[GET_SLOTS_ERROR]", error);
        throw error;
      }
      console.log("[CLIENT_PORTAL_GENERATED_SLOTS]", {
        slotsCount: data?.length || 0,
        slots: data
      });
      return data as ConsultantAvailableSlot[];
    },
    enabled: !!(filters.consultantId || filters.contractPhaseId),
  });

  const upsertAvailability = useMutation({
    mutationFn: async (availability: Partial<ConsultantAvailability>) => {
      const { data, error } = await supabase
        .from('consultant_availability')
        .upsert(availability as any)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant-availability'] });
      toast({ title: 'Sucesso', description: 'Disponibilidade salva com sucesso.' });
    },
  });

  const deleteAvailability = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('consultant_availability').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant-availability'] });
      toast({ title: 'Sucesso', description: 'Disponibilidade removida.' });
    },
  });

  const upsertSlot = useMutation({
    mutationFn: async (slot: Partial<ConsultantAvailableSlot>) => {
      const { data, error } = await supabase
        .from('consultant_available_slots')
        .upsert(slot as any)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant-slots'] });
    },
  });

  return { 
    availabilities, 
    slots, 
    isLoading: isLoadingRules || isLoadingSlots, 
    upsertAvailability, 
    deleteAvailability,
    upsertSlot
  };
}
