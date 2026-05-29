import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClientProduct {
  id: string;
  clientId: string;
  clientNome?: string;
  productId: string;
  productNome?: string;
  contractId?: string;
  contractTipo?: string;
  consultantId?: string;
  consultantNome?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  currentPhaseId?: string;
  clientVisible: boolean;
  internalNotes?: string;
  clientNotes?: string;
  createdAt: string;
}

export function useClientProducts(clientId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clientProducts, isLoading, error } = useQuery({
    queryKey: ['client-products', clientId],
    queryFn: async () => {
      let query = supabase
        .from('contract_products')
        .select(`
          *,
          contract:contracts (
            client_id,
            type,
            client:clients (trade_name),
            consultant:profiles (full_name)
          ),
          product:products (name, description, category, consultant_hours, silvane_hours)
        `);

      if (clientId) {
        query = query.filter('contract.client_id', 'eq', clientId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((cp: any) => ({
        id: cp.id,
        clientId: cp.contract?.client_id,
        clientNome: cp.contract?.client?.trade_name || 'Desconhecido',
        productId: cp.product_id,
        productNome: cp.product_name || cp.product?.name || 'N/A', // Snapshot fallback
        contractId: cp.contract_id,
        contractTipo: cp.contract?.type,
        consultantId: cp.contract?.consultant_id,
        consultantNome: cp.contract?.consultant?.full_name || 'Desconhecido',
        status: cp.status,
        startDate: cp.start_date,
        endDate: cp.end_date,
        currentPhaseId: cp.current_phase_id,
        clientVisible: cp.client_visible,
        internalNotes: cp.internal_notes,
        clientNotes: cp.client_notes,
        createdAt: cp.created_at,
      })) as ClientProduct[];
    },
  });

  const upsertClientProduct = useMutation({
    mutationFn: async (cp: Partial<ClientProduct>) => {
      const payload: any = {
        contract_id: cp.contractId,
        product_id: cp.productId,
        status: cp.status,
        start_date: cp.startDate,
        end_date: cp.endDate,
        current_phase_id: cp.currentPhaseId,
        client_visible: cp.clientVisible,
        internal_notes: cp.internalNotes,
        client_notes: cp.clientNotes,
      };

      if (cp.id) payload.id = cp.id;

      const { data, error } = await supabase
        .from('contract_products')
        .upsert(payload)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-products'] });
      queryClient.invalidateQueries({ queryKey: ['contract-products'] });
      toast({ title: 'Sucesso', description: 'Produto contratado atualizado.' });
    },
  });

  const deleteClientProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contract_products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-products'] });
      queryClient.invalidateQueries({ queryKey: ['contract-products'] });
      toast({ title: 'Sucesso', description: 'Produto contratado removido.' });
    },
  });

  return { clientProducts, isLoading, error, upsertClientProduct, deleteClientProduct };
}
