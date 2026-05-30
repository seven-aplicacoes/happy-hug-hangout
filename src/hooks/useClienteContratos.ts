import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Contrato, StatusContrato, NivelRisco, FaseMetodologica } from '@/types';

export function useClienteContratos(clientId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: contratos, isLoading, error } = useQuery({
    queryKey: ['cliente-contratos', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          clients (trade_name, consultant_id),
          profiles (full_name),
          products (name)
        `)
        .eq('client_id', clientId);

      if (error) throw error;

      return data.map((c: any) => ({
        id: c.id,
        clienteId: c.client_id,
        clienteNome: c.clients?.trade_name || 'Desconhecido',
        tipo: c.type || c.products?.name || 'Consultoria',
        valor: Number(c.value) || 0,
        dataInicio: c.start_date,
        dataFim: c.end_date,
        status: c.status as StatusContrato,
        risco: c.risk_level as NivelRisco,
        faseMetodologica: c.current_phase as FaseMetodologica,
        consultorId: c.consultant_id,
        consultorNome: c.profiles?.full_name || 'Desconhecido',
        productId: c.product_id,
        consultantId: c.consultant_id || c.clients?.consultant_id,
        consultantName: c.profiles?.full_name || 'Desconhecido',
      })) as (Contrato & { consultantName: string })[];
    },
    enabled: !!clientId,
  });

  const upsertContrato = useMutation({
    mutationFn: async (contrato: Partial<Contrato>) => {
      const payload: any = {
        client_id: clientId,
        type: contrato.tipo,
        value: contrato.valor,
        start_date: contrato.dataInicio,
        end_date: contrato.dataFim,
        status: contrato.status,
        risk_level: contrato.risco,
        current_phase: contrato.faseMetodologica,
        consultant_id: contrato.consultorId || user?.id,
        product_id: contrato.productId,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      };

      if (contrato.id) {
        payload.id = contrato.id;
      } else {
        payload.created_by = user?.id;
      }

      const { data, error } = await supabase
        .from('contracts')
        .upsert(payload)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-contratos', clientId] });
      toast({ title: 'Sucesso', description: 'Contrato salvo com sucesso.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });

  return { contratos, isLoading, error, upsertContrato };
}
