import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, differenceInDays, parseISO } from 'date-fns';
import type { Cliente, FaseMetodologica, Contrato, Reuniao, Tarefa } from '@/types';
import { normalizeTaskStatus } from '@/constants/taskStatus';

export function useAdminDashboardMetrics() {
  return useQuery({
    queryKey: ['admin-dashboard-metrics'],
    queryFn: async () => {
      const [
        { data: clientsRaw, error: clientsError },
        { data: contractsRaw, error: contractsError },
        { data: tasksRaw, error: tasksError },
        { data: meetingsRaw, error: meetingsError },
        { data: consultants, error: consultantsError },
        { data: alerts, error: alertsError },
      ] = await Promise.all([
        supabase.from('clients').select('*, consultant:profiles!clients_consultant_id_fkey(full_name)').is('deleted_at', null),
        supabase.from('contracts').select('*, clients(trade_name, corporate_name), profiles(full_name)'),
        supabase.from('tasks').select('*, clients(trade_name)'),
        supabase.from('meetings').select('*, client:client_id(trade_name, corporate_name), profile:consultant_id(full_name)'),
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

      const contracts: Contrato[] = (contractsRaw || []).map((c: any) => ({
        id: c.id,
        clienteId: c.client_id,
        clienteNome: c.clients?.trade_name || c.clients?.corporate_name || 'Desconhecido',
        tipo: c.type || 'Consultoria',
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
      }));

      const meetings: Reuniao[] = (meetingsRaw || []).map((r: any) => ({
        id: r.id,
        clienteId: r.client_id,
        clienteNome: r.client?.trade_name || r.client?.corporate_name || 'Desconhecido',
        consultorId: r.consultant_id,
        consultorNome: r.profile?.full_name || 'Desconhecido',
        meetingDate: r.meeting_date,
        startTime: r.start_time,
        duracao: r.duration,
        tipo: r.type,
        title: r.title,
        status: r.status,
        participantes: Array.isArray(r.participants) ? r.participants : [],
      }));

      const tasks: Tarefa[] = (tasksRaw || []).map((t: any) => ({
        id: t.id,
        titulo: t.title,
        descricao: t.description,
        clienteId: t.client_id,
        clienteNome: t.clients?.trade_name || 'Desconhecido',
        contratoId: t.contract_id,
        consultorId: t.consultant_id,
        consultorNome: t.profiles?.full_name || 'Desconhecido',
        tipo: t.demand_type || 'consultoria',
        status: normalizeTaskStatus(t.status),
        prioridade: t.priority,
        dataVencimento: t.due_date ? t.due_date.split('T')[0] : '',
        dataCriacao: t.created_at,
        completedAt: t.completed_at,
      }));

      // Helper for last interaction
      const getLastInteraction = (clientId: string) => {
        const lastMeeting = meetings.filter(m => m.clienteId === clientId && m.meetingDate).sort((a, b) => b.meetingDate.localeCompare(a.meetingDate))[0]?.meetingDate;
        const lastTask = tasks.filter(t => t.clienteId === clientId && t.completedAt).sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))[0]?.completedAt;
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
