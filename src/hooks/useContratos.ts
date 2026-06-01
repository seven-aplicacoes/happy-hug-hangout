import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Contrato } from '@/types';

export function useContratos() {
  const { user, perfil } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contratos, isLoading, error } = useQuery({
    queryKey: ['contratos', perfil, user?.consultorId],
    queryFn: async () => {
      let query = supabase
        .from('contracts')
        .select(`
          *,
          clients (id, trade_name, corporate_name),
          profiles (id, full_name),
          products (id, name, description, category, consultant_hours, silvane_hours)
        `);

      if (perfil === 'consultor' && user?.consultorId) {
        query = query.eq('consultant_id', user.consultorId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map((c: any) => ({
        id: c.id,
        clienteId: c.client_id,
        clienteNome: c.clients?.trade_name || c.clients?.corporate_name || 'Desconhecido',
        tipo: c.type || c.products?.name || 'Consultoria',
        valor: Number(c.value) || 0,
        dataInicio: c.start_date,
        dataFim: c.end_date,
        status: c.status,
        risco: c.risk_level,
        faseMetodologica: c.current_phase,
        consultorId: c.consultant_id,
        consultorNome: c.profiles?.full_name || 'Desconhecido',
        productId: c.product_id,
        contractNumber: c.contract_number,
      })) as Contrato[];
    },
  });

  const upsertContrato = useMutation({
    mutationFn: async (contrato: Partial<Contrato>) => {
      const payload: any = {
        client_id: contrato.clienteId,
        type: contrato.tipo,
        value: contrato.valor,
        start_date: contrato.dataInicio,
        end_date: contrato.dataFim,
        status: contrato.status,
        risk_level: contrato.risco,
        current_phase: contrato.faseMetodologica,
        consultant_id: contrato.consultorId,
        product_id: contrato.productId,
        contract_number: contrato.contractNumber,
      };

      if (contrato.id && typeof contrato.id === 'string' && contrato.id.length > 10) {
        payload.id = contrato.id;
      }

      const { data, error } = await supabase
        .from('contracts')
        .upsert(payload)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast({ title: 'Sucesso', description: 'Contrato salvo com sucesso.' });
    },
  });

  const deleteContrato = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast({ title: 'Sucesso', description: 'Contrato removido.' });
    },
    onError: (error: any) => {
      console.error('Erro ao excluir contrato:', error);
      toast({ 
        title: 'Erro ao excluir', 
        description: error.message || 'Ocorreu um erro ao tentar excluir o contrato. Verifique se existem dependências.',
        variant: 'destructive'
      });
    },
  });

  return { contratos, isLoading, error, upsertContrato, deleteContrato };
}
