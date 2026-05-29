import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { Cliente, FaseMetodologica } from '@/types';

export function useClientes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, perfil } = useAuth();

  const { data: clientes, isLoading, error } = useQuery({
    queryKey: ['clientes', perfil, user?.consultorId],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select(`
          *,
          consultant:profiles!clients_consultant_id_fkey (
            full_name
          )
        `);

      if (user?.role !== 'admin' && perfil === 'consultor' && user?.consultorId) {
        query = query.eq('consultant_id', user.consultorId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map((c: any) => ({
        id: c.id,
        razaoSocial: c.corporate_name,
        nomeFantasia: c.trade_name,
        cnpj: c.cnpj,
        segmento: c.segment,
        clinicSpecialty: c.clinic_specialty,
        regiao: c.region,
        consultorId: c.consultant_id,
        porte: c.company_size as any,
        consultorNome: c.consultant?.full_name || 'Não atribuído',
        especialidade: 'gestao',
        faseMetodologica: c.methodology_phase as FaseMetodologica,
        indiceSeven: c.seven_index || 0,
        potencialUpsell: c.upsell_potential || false,
        dataInicio: c.start_date,
        ultimaInteracao: c.last_interaction,
        status: c.status,
        faturamentoMensal: Number(c.monthly_revenue) || 0,
        portal_access_enabled: c.portal_access_enabled,
        auth_user_id: c.auth_user_id,
        email: c.email,
        institutional_email: c.institutional_email,
        cep: c.cep,
        street: c.street,
        number: c.number,
        complement: c.complement,
        neighborhood: c.neighborhood,
        pains: c.pains || [],
        success_factors: c.success_factors || [],
        current_objective: c.current_objective,
        briefing: c.briefing,
      })) as Cliente[];
    },
  });

  const upsertCliente = useMutation({
    mutationFn: async (newCliente: Partial<Cliente>) => {
      const payload = {
        id: newCliente.id,
        corporate_name: newCliente.razaoSocial,
        trade_name: newCliente.nomeFantasia,
        cnpj: newCliente.cnpj,
        segment: newCliente.segmento,
        region: newCliente.regiao,
        consultant_id: newCliente.consultorId || (perfil === 'consultor' ? user?.consultorId : null),
        company_size: newCliente.porte,
        methodology_phase: newCliente.faseMetodologica || 'diagnostico',
        seven_index: newCliente.indiceSeven,
        upsell_potential: newCliente.potencialUpsell,
        start_date: newCliente.dataInicio,
        status: newCliente.status || 'ativo',
        monthly_revenue: newCliente.faturamentoMensal,
        pains: newCliente.pains,
        success_factors: newCliente.success_factors,
        current_objective: newCliente.current_objective,
        briefing: newCliente.briefing,
        email: newCliente.email,
        institutional_email: newCliente.institutional_email,
        cep: newCliente.cep,
        street: newCliente.street,
        number: newCliente.number,
        complement: newCliente.complement,
        neighborhood: newCliente.neighborhood,
      };

      const { data, error } = await supabase
        .from('clients')
        .upsert(payload as any)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({ title: 'Sucesso', description: 'Cliente salvo com sucesso.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCliente = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({ title: 'Sucesso', description: 'Cliente removido com sucesso.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });

  return { clientes, isLoading, error, upsertCliente, deleteCliente };
}
