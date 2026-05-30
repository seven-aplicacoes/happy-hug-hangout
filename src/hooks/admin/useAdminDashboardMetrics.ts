import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, differenceInDays, parseISO } from 'date-fns';
import type { Cliente, FaseMetodologica } from '@/types';

export function useAdminDashboardMetrics() {
  return useQuery({
    queryKey: ['admin-dashboard-metrics'],
    queryFn: async () => {
      // 1. Fetch all required data in parallel
      const [
        { data: clientsRaw, error: clientsError },
        { data: contracts, error: contractsError },
        { data: tasks, error: tasksError },
        { data: meetings, error: meetingsError },
        { data: consultants, error: consultantsError },
        { data: alerts, error: alertsError },
      ] = await Promise.all([
        supabase.from('clients').select('*, consultant:profiles!clients_consultant_id_fkey(full_name)').is('deleted_at', null),
        supabase.from('contracts').select('*, clients(trade_name), profiles(full_name)'),
        supabase.from('tasks').select('*, clients(trade_name)'),
        supabase.from('meetings').select('*, client:client_id(trade_name), profile:consultant_id(full_name)'),
        supabase.from('profiles').select('*').in('role', ['consultor', 'admin']),
        supabase.from('client_alerts').select('*').eq('status', 'active'),
      ]);

      if (clientsError) throw clientsError;
      if (contractsError) throw contractsError;
      if (tasksError) throw tasksError;
      if (meetingsError) throw meetingsError;
      if (consultantsError) throw consultantsError;
      if (alertsError) throw alertsError;

      const hoje = startOfDay(new Date());

      // Map clients to standard Cliente type
      const clients: Cliente[] = (clientsRaw || []).map((c: any) => ({
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
        avatar_url: c.avatar_url,
        avatar_path: c.avatar_path,
        created_at: c.created_at
      }));

      // Helper for last interaction
      const getLastInteraction = (clientId: string) => {
        const lastMeeting = meetings.filter(m => m.client_id === clientId && m.meeting_date).sort((a, b) => b.meeting_date.localeCompare(a.meeting_date))[0]?.meeting_date;
        const lastTask = tasks.filter(t => t.client_id === clientId && t.completed_at).sort((a, b) => b.completed_at.localeCompare(a.completed_at))[0]?.completed_at;
        const lastInteractionDate = lastMeeting || (lastTask ? lastTask.split('T')[0] : null);
        
        return lastInteractionDate ? parseISO(lastInteractionDate) : null;
      };

      const clientsWithMetrics = clients.map(c => {
        const lastInteraction = getLastInteraction(c.id);
        const creationDate = c.dataInicio ? parseISO(c.dataInicio) : ( (c as any).created_at ? parseISO((c as any).created_at) : hoje);
        const diasSemInteracao = lastInteraction 
            ? differenceInDays(hoje, lastInteraction) 
            : differenceInDays(hoje, creationDate);
            
        return {
          ...c,
          diasSemInteracao: Math.max(0, diasSemInteracao),
        };
      });

      // Wallet Health
      const walletHealth = {
        emDia: clientsWithMetrics.filter(c => c.diasSemInteracao <= 8).length,
        atencao: clientsWithMetrics.filter(c => c.diasSemInteracao > 8 && c.diasSemInteracao <= 15).length,
        critico: clientsWithMetrics.filter(c => c.diasSemInteracao > 15).length,
      };

      return {
        clients: clientsWithMetrics,
        contracts,
        tasks,
        meetings,
        consultants,
        alerts,
        walletHealth
      };
    },
  });
}
