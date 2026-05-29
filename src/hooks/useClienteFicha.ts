import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Cliente, FaseMetodologica } from '@/types';

export function useClienteFicha(clientId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { perfil, user } = useAuth();

  const { data: cliente, isLoading, error } = useQuery({
    queryKey: ['cliente-ficha', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          consultant:profiles!clients_consultant_id_fkey (
            full_name
          )
        `)
        .eq('id', clientId)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        razaoSocial: data.corporate_name,
        nomeFantasia: data.trade_name,
        cnpj: data.cnpj,
        segmento: data.segment,
        clinicSpecialty: data.clinic_specialty,
        regiao: data.region,
        consultorId: data.consultant_id,
        porte: data.company_size as any,
        consultorNome: data.consultant?.full_name || 'Não atribuído',
        especialidade: 'gestao',
        faseMetodologica: data.methodology_phase as FaseMetodologica,
        indiceSeven: data.seven_index || 0,
        potencialUpsell: data.upsell_potential || false,
        dataInicio: data.start_date,
        ultimaInteracao: data.last_interaction,
        status: data.status,
        faturamentoMensal: Number(data.monthly_revenue) || 0,
        portal_access_enabled: data.portal_access_enabled,
        auth_user_id: data.auth_user_id,
        email: data.email,
        institutional_email: data.institutional_email,
        cep: data.cep,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        pains: data.pains || [],
        success_factors: data.success_factors || [],
        current_objective: data.current_objective,
        briefing: data.briefing,
        contact_name: data.contact_name,
        contact_phone: data.contact_phone,
      } as Cliente;
    },
    enabled: !!clientId,
  });

  const updateCliente = useMutation({
    mutationFn: async (updates: Partial<Cliente>) => {
      const payload: any = {};
      if (updates.razaoSocial !== undefined) payload.corporate_name = updates.razaoSocial;
      if (updates.nomeFantasia !== undefined) payload.trade_name = updates.nomeFantasia;
      if (updates.cnpj !== undefined) payload.cnpj = updates.cnpj;
      if (updates.segmento !== undefined) payload.segment = updates.segmento;
      if (updates.clinicSpecialty !== undefined) payload.clinic_specialty = updates.clinicSpecialty;
      if (updates.regiao !== undefined) payload.region = updates.regiao;
      if (updates.consultorId !== undefined) payload.consultant_id = updates.consultorId;
      if (updates.porte !== undefined) payload.company_size = updates.porte;
      if (updates.faseMetodologica !== undefined) payload.methodology_phase = updates.faseMetodologica;
      if (updates.indiceSeven !== undefined) payload.seven_index = updates.indiceSeven;
      if (updates.potencialUpsell !== undefined) payload.upsell_potential = updates.potencialUpsell;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.faturamentoMensal !== undefined) payload.monthly_revenue = updates.faturamentoMensal;
      if (updates.pains !== undefined) payload.pains = updates.pains;
      if (updates.success_factors !== undefined) payload.success_factors = updates.success_factors;
      if (updates.current_objective !== undefined) payload.current_objective = updates.current_objective;
      if (updates.briefing !== undefined) payload.briefing = updates.briefing;
      if (updates.contact_name !== undefined) payload.contact_name = updates.contact_name;
      if (updates.contact_phone !== undefined) payload.contact_phone = updates.contact_phone;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.institutional_email !== undefined) payload.institutional_email = updates.institutional_email;
      if (updates.cep !== undefined) payload.cep = updates.cep;
      if (updates.street !== undefined) payload.street = updates.street;
      if (updates.number !== undefined) payload.number = updates.number;
      if (updates.complement !== undefined) payload.complement = updates.complement;
      if (updates.neighborhood !== undefined) payload.neighborhood = updates.neighborhood;

      payload.updated_at = new Date().toISOString();
      payload.updated_by = user?.id;

      const { data, error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', clientId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-ficha', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({ title: 'Sucesso', description: 'Dados do cliente atualizados.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });

  return { cliente, isLoading, error, updateCliente };
}
