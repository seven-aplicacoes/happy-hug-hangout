import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tarefa, StatusTarefa } from '@/types';
import { normalizeTaskStatus } from '@/constants/taskStatus';

export function useClienteTarefas(clientId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: tarefas, isLoading, error } = useQuery({
    queryKey: ['cliente-tarefas', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          clients (trade_name),
          contracts (type),
          profiles:consultant_id (full_name)
        `)
        .eq('client_id', clientId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      return data.map((t: any) => ({
        id: t.id,
        titulo: t.title,
        descricao: t.description,
        clienteId: t.client_id,
        clienteNome: t.clients?.trade_name || 'Desconhecido',
        contratoId: t.contract_id,
        contratoNome: t.contracts?.type || 'Sem contrato',
        consultorId: t.consultant_id,
        consultorNome: t.profiles?.full_name || 'Desconhecido',
        tipo: t.demand_type || t.origin || 'consultoria', 
        status: normalizeTaskStatus(t.status) as StatusTarefa,
        prioridade: t.priority as any,
        dataVencimento: t.due_date ? t.due_date.split('T')[0] : '',
        dataCriacao: t.created_at,
        origem: t.origin,
        motivoImpedimento: t.impediment_reason,
        impedimentHistory: Array.isArray(t.impediment_history) ? t.impediment_history : [],
        contractProductId: t.contract_product_id,
        contractProductPhaseId: t.contract_product_phase_id,
        methodologyPhaseId: t.methodology_phase_id,
        methodologyWeekId: t.methodology_week_id,
        completedAt: t.completed_at
      })) as Tarefa[];
    },
    enabled: !!clientId,
  });

  const upsertTarefa = useMutation({
    mutationFn: async (tarefa: Partial<Tarefa>) => {
      const payload: any = {
        client_id: clientId,
        title: tarefa.titulo,
        description: tarefa.descricao,
        contract_id: tarefa.contratoId,
        contract_product_id: tarefa.contractProductId,
        contract_product_phase_id: tarefa.contractProductPhaseId,
        consultant_id: tarefa.consultorId || user?.id,
        status: tarefa.status,
        priority: tarefa.prioridade,
        due_date: tarefa.dataVencimento,
        demand_type: tarefa.tipo || 'consultoria',
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      };

      if (tarefa.id) {
        payload.id = tarefa.id;
      } else {
        payload.created_by = user?.id;
      }

      const { data, error } = await supabase
        .from('tasks')
        .upsert(payload)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-tarefas', clientId] });
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      toast({ title: 'Sucesso', description: 'Tarefa salva.' });
    },
  });

  return { tarefas, isLoading, error, upsertTarefa };
}
