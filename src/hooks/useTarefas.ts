import { getFriendlyError } from '@/lib/friendlyErrors';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { startOfDay, isBefore, parseISO } from 'date-fns';
import type { Tarefa, StatusTarefa } from '@/types';
import { normalizeTaskStatus } from '@/constants/taskStatus';

export function useTarefas() {
  const { user, perfil } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tarefas, isLoading, error } = useQuery({
    queryKey: ['tarefas', perfil, user?.consultorId],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          clients (trade_name),
          contracts (type),
          contract_products (
            product_name,
            product:products (name)
          ),
          profiles:consultant_id (full_name),
          delegated_profile:delegated_by (full_name)
        `);

      if (perfil === 'consultor' && user?.consultorId) {
        const { data: myClients } = await supabase.from('clients').select('id').eq('consultant_id', user.consultorId);
        const clientIds = myClients?.map(c => c.id) || [];
        
        if (clientIds.length > 0) {
          query = query.or(`consultant_id.eq.${user.consultorId},client_id.in.(${clientIds.join(',')})`);
        } else {
          query = query.eq('consultant_id', user.consultorId);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      const hoje = startOfDay(new Date());

      return data.map((t: any) => {
        return {
          id: t.id,
          titulo: t.title,
          descricao: t.description,
          clienteId: t.client_id,
          clienteNome: t.clients?.trade_name || 'Desconhecido',
          contratoId: t.contract_id,
          contratoNome: t.contracts?.type || 'Sem contrato vinculado',
          produtoNome: t.contract_products?.product_name || t.contract_products?.product?.name || null,
          consultorId: t.consultant_id,
          consultorNome: t.profiles?.full_name || 'Desconhecido',
          tipo: t.demand_type || t.origin || 'consultoria', 
          status: normalizeTaskStatus(t.status),
          prioridade: t.priority,
          dataVencimento: t.due_date ? t.due_date.split('T')[0] : '',
          dataCriacao: t.created_at,
          origem: t.origin,
          motivoImpedimento: t.impediment_reason,
          impedimentHistory: Array.isArray(t.impediment_history) ? t.impediment_history : [],
          contractProductId: t.contract_product_id,
          contractProductPhaseId: t.contract_product_phase_id,
          completedAt: t.completed_at,
          createdBy: t.created_by,
          createdByName: t.created_by_name,
          createdByRole: t.created_by_role,
          delegatedBy: t.delegated_by,
          delegatedByName: t.delegated_profile?.full_name
        };
      }) as (Tarefa & { isAtrasada?: boolean })[];
    },
  });

  const upsertTarefa = useMutation({
    mutationFn: async (tarefa: Partial<Tarefa> & { novoImpedimento?: { reason: string } }) => {
      const payload: any = {
        title: tarefa.titulo,
        description: tarefa.descricao,
        client_id: (tarefa.clienteId && typeof tarefa.clienteId === 'string' && tarefa.clienteId.trim() !== '') ? tarefa.clienteId : null,
        contract_id: (tarefa.contratoId && typeof tarefa.contratoId === 'string' && tarefa.contratoId.trim() !== '') ? tarefa.contratoId : null,
        consultant_id: (tarefa.consultorId && typeof tarefa.consultorId === 'string' && tarefa.consultorId.trim() !== '') ? tarefa.consultorId : null,
        status: tarefa.status,
        priority: tarefa.prioridade,
        due_date: (tarefa.dataVencimento && typeof tarefa.dataVencimento === 'string' && tarefa.dataVencimento.trim() !== '') ? tarefa.dataVencimento : null,
        origin: tarefa.origem,
        demand_type: tarefa.tipo || 'consultoria',
        contract_product_id: (tarefa as any).contractProductId && typeof (tarefa as any).contractProductId === 'string' && (tarefa as any).contractProductId.trim() !== '' ? (tarefa as any).contractProductId : null,
        contract_product_phase_id: (tarefa as any).contractProductPhaseId && typeof (tarefa as any).contractProductPhaseId === 'string' && (tarefa as any).contractProductPhaseId.trim() !== '' ? (tarefa as any).contractProductPhaseId : null,
        delegated_by: tarefa.delegatedBy || null,
      };

      if (!tarefa.id) {
        payload.created_by = user?.id;
        payload.created_by_name = user?.nome;
        payload.created_by_role = user?.role;
      }

      if (tarefa.id) payload.id = tarefa.id;
      if (tarefa.status === 'concluida' && !tarefa.completedAt) {
        payload.completed_at = new Date().toISOString();
      }

      // Registro de novo impedimento: anexa ao histórico e atualiza campos atuais
      if (tarefa.novoImpedimento?.reason) {
        const now = new Date().toISOString();
        const previousHistory = Array.isArray(tarefa.impedimentHistory) ? tarefa.impedimentHistory : [];
        const entry = {
          reason: tarefa.novoImpedimento.reason,
          created_at: now,
          created_by: user?.id,
          created_by_name: user?.nome,
        };
        payload.impediment_reason = tarefa.novoImpedimento.reason;
        payload.impeded_at = now;
        payload.impeded_by = user?.id || null;
        payload.impediment_history = [entry, ...previousHistory];
      }
      // Caso contrário, NÃO mexe em impediment_reason / impediment_history / impeded_*
      // para preservar histórico ao sair do status "impedida".

      const { data, error } = await supabase
        .from('tasks')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;


      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      queryClient.invalidateQueries({ queryKey: ['cliente-tarefas'] });
      toast({ title: 'Sucesso', description: 'Tarefa salva com sucesso.' });
    },
    onError: (error: any) => {
      console.error('Error in upsertTarefa:', error);
      toast({ 
        title: 'Erro ao salvar', 
        description: getFriendlyError(error).description,
        variant: 'destructive'
      });
    }
  });

  const deleteTarefa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      toast({ title: 'Sucesso', description: 'Tarefa removida.' });
    },
  });

  return { tarefas, isLoading, error, upsertTarefa, deleteTarefa };
}
