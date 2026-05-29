import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ContractProduct {
  id: string;
  contractId: string;
  productId: string;
  productNome?: string;
  productName?: string;
  productDescription?: string;
  productCategory?: string;
  consultantHours?: number;
  silvaneHours?: number;
  status: string;
  startDate?: string;
  endDate?: string;
  
  value?: number;
  currentPhaseId?: string;
  currentWeekId?: string;
  currentWeekNumber?: number;
  clientVisible: boolean;
  internalNotes?: string;
  clientNotes?: string;
}

export function useContractProducts(contractId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['contract-products', contractId],
    queryFn: async () => {
      if (!contractId) return [];
      const { data, error } = await supabase
        .from('contract_products')
        .select(`
          *,
          product:products (name)
        `)
        .eq('contract_id', contractId);

      if (error) throw error;

      return (data || []).map((cp: any) => ({
        id: cp.id,
        contractId: cp.contract_id,
        productId: cp.product_id,
        productNome: cp.product?.name || 'N/A',
        status: cp.status,
        startDate: cp.start_date,
        endDate: cp.end_date,
        
        value: cp.value,
        currentPhaseId: cp.current_phase_id,
        currentWeekId: cp.current_week_id,
        currentWeekNumber: cp.current_week_number,
        clientVisible: cp.client_visible,
        internalNotes: cp.internal_notes,
        clientNotes: cp.client_notes,
      })) as ContractProduct[];
    },
    enabled: !!contractId,
  });

  const upsertContractProducts = useMutation({
    mutationFn: async (items: Partial<ContractProduct>[]) => {
      const { data, error } = await supabase
        .from('contract_products')
        .upsert(items.map(item => {
          const payload: any = {
            contract_id: item.contractId,
            product_id: item.productId,
            status: item.status || 'ativo',
            start_date: item.startDate,
            end_date: item.endDate,
            
            value: item.value,
            client_visible: item.clientVisible !== undefined ? item.clientVisible : true,
            internal_notes: item.internalNotes,
            client_notes: item.clientNotes,
          };
          
          if (item.id && typeof item.id === 'string' && item.id.length > 10) {
            payload.id = item.id;
          }
          
          return payload;
        }))
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-products', contractId] });
      queryClient.invalidateQueries({ queryKey: ['client-products'] });
    },
  });

  return { products, isLoading, error, upsertContractProducts };
}
