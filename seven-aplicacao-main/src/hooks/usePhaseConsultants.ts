import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PhaseConsultant {
  id: string;
  contractProductId: string;
  methodologyPhaseId: string;
  consultantId: string;
  consultantNome?: string;
  role?: string;
  isPrimary: boolean;
  startDate?: string;
  endDate?: string;
}

export function usePhaseConsultants(contractProductId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: consultants, isLoading, error } = useQuery({
    queryKey: ['phase-consultants', contractProductId],
    queryFn: async () => {
      if (!contractProductId) return [];
      const { data, error } = await supabase
        .from('contract_product_phase_consultants')
        .select(`
          *,
          consultant:profiles (full_name)
        `)
        .eq('contract_product_id', contractProductId);

      if (error) throw error;

      return (data || []).map((c: any) => ({
        id: c.id,
        contractProductId: c.contract_product_id,
        methodologyPhaseId: c.methodology_phase_id,
        consultantId: c.consultant_id,
        consultantNome: c.consultant?.full_name || 'N/A',
        role: c.role,
        isPrimary: c.is_primary,
        startDate: c.start_date,
        endDate: c.end_date,
      })) as PhaseConsultant[];
    },
    enabled: !!contractProductId,
  });

  const upsertConsultant = useMutation({
    mutationFn: async (c: Partial<PhaseConsultant>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const payload: any = {
        contract_product_id: c.contractProductId,
        methodology_phase_id: c.methodologyPhaseId,
        consultant_id: c.consultantId,
        role: c.role,
        is_primary: c.isPrimary !== undefined ? c.isPrimary : true,
        start_date: c.startDate,
        end_date: c.endDate,
        assigned_by: user?.id
      };

      if (c.id) payload.id = c.id;

      const { data, error } = await supabase
        .from('contract_product_phase_consultants')
        .upsert(payload)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-consultants', contractProductId] });
      toast({ title: 'Sucesso', description: 'Consultor atribuído à fase.' });
    },
  });

  return { consultants, isLoading, error, upsertConsultant };
}
