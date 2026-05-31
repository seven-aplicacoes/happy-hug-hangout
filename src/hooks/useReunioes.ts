import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Reuniao } from '@/types';

export function useReunioes() {
  const { user, perfil } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reunioes, isLoading, error } = useQuery({
    queryKey: ['reunioes', perfil, user?.consultorId],
    queryFn: async () => {
      // 1. Fetch manual meetings from 'meetings' table
      let meetingsQuery = supabase
        .from('meetings')
        .select(`
          *,
          client:client_id (trade_name, corporate_name),
          profile:consultant_id (full_name)
        `);

      if (perfil === 'consultor' && user?.consultorId) {
        meetingsQuery = meetingsQuery.eq('consultant_id', user.consultorId);
      }

      const { data: meetingsData, error: meetingsError } = await meetingsQuery;
      if (meetingsError) throw meetingsError;

      // 2. Fetch scheduled meetings from 'contract_module_meetings' table
      let moduleMeetingsQuery = supabase
        .from('contract_module_meetings')
        .select(`
          *,
          client:client_id (trade_name, corporate_name),
          profile:consultant_id (full_name),
          contract:contract_id (tipo),
          product:product_id (name)
        `)
        .neq('status', 'pendente') // Carregar agendadas, canceladas e concluídas
        .order('scheduled_at', { ascending: false });

      if (perfil === 'consultor' && user?.consultorId) {
        moduleMeetingsQuery = moduleMeetingsQuery.eq('consultant_id', user.consultorId);
      }

      const { data: moduleMeetingsData, error: moduleMeetingsError } = await moduleMeetingsQuery;
      if (moduleMeetingsError) throw moduleMeetingsError;

      // 3. Merge and normalize
      const meetings = (meetingsData || []).map((r: any) => ({
        id: r.id,
        clienteId: r.client_id,
        clienteNome: r.client?.trade_name || r.client?.corporate_name || 'Desconhecido',
        contratoId: r.contract_id,
        contractProductId: r.contract_product_id,
        contractProductPhaseId: r.contract_product_phase_id,
        consultorId: r.consultant_id,
        consultorNome: r.profile?.full_name || 'Desconhecido',
        meetingDate: r.meeting_date || '',
        data: r.meeting_date || '',
        startTime: r.start_time || '',
        hora: r.start_time || '',
        duracao: r.duration,
        tipo: r.type || 'Reunião',
        title: r.title,
        pauta: r.title,
        description: r.description,
        status: r.status,
        ata: r.meeting_minutes,
        participantes: Array.isArray(r.participants) ? r.participants : [],
        source: r.source || 'manual',
        externalId: r.external_id,
        meetingUrl: r.meeting_url,
        location: r.location,
        scheduledBy: r.scheduled_by,
        contractModuleMeetingId: r.contract_module_meeting_id,
        cancelUrl: r.cancel_url,
        rescheduleUrl: r.reschedule_url,
      }));

      const moduleMeetings = (moduleMeetingsData || []).map((m: any) => {
        // Se a reunião estiver vinculada à tabela 'meetings', usamos a versão de 'meetings'
        // Mas se for um encontro de módulo que só existe aqui, exibimos.
        if (meetings.some(mTable => mTable.contractModuleMeetingId === m.id)) {
          return null;
        }

        const scheduledDate = m.scheduled_at ? m.scheduled_at.split('T')[0] : '';
        const scheduledTime = m.scheduled_at ? new Date(m.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

        return {
          id: m.id,
          clienteId: m.client_id,
          clienteNome: m.client?.trade_name || m.client?.corporate_name || 'Desconhecido',
          contratoId: m.contract_id,
          contratoNome: m.contract?.tipo,
          productId: m.product_id,
          produtoNome: m.product?.name,
          moduleId: m.module_id,
          consultorId: m.consultant_id,
          consultorNome: m.profile?.full_name || 'Desconhecido',
          meetingDate: scheduledDate,
          data: scheduledDate,
          startTime: scheduledTime,
          hora: scheduledTime,
          duracao: 60,
          tipo: 'Encontro de Módulo',
          title: m.title || `Encontro #${m.meeting_number}`,
          pauta: m.title || `Encontro #${m.meeting_number}`,
          status: m.status === 'agendado' ? 'agendada' : (m.status === 'cancelada' ? 'cancelada' : (m.status === 'realizada' ? 'realizada' : m.status)),
          participantes: [],
          source: 'module_meeting',
          contractModuleMeetingId: m.id,
          cancelUrl: m.cancel_url,
          rescheduleUrl: m.reschedule_url,
        };
      }).filter(Boolean);

      return [...meetings, ...moduleMeetings] as Reuniao[];

    },
  });

  const upsertReuniao = useMutation({
    mutationFn: async (reuniao: Partial<Reuniao>) => {
      const payload: any = {
        id: reuniao.id,
        client_id: reuniao.clienteId,
        contract_id: reuniao.contractId,
        contract_product_id: reuniao.contractProductId,
        contract_product_phase_id: reuniao.contractProductPhaseId,
        consultant_id: reuniao.consultorId,
        meeting_date: reuniao.meetingDate,
        start_time: reuniao.startTime,
        duration: reuniao.duracao,
        type: reuniao.tipo,
        title: reuniao.title,
        description: reuniao.description,
        status: reuniao.status,
        meeting_minutes: reuniao.ata,
        participants: reuniao.participantes,
        source: reuniao.source || 'manual',
        external_id: reuniao.externalId,
        meeting_url: reuniao.meetingUrl,
        location: reuniao.location,
        scheduled_by: reuniao.scheduledBy || user?.id,
        contract_module_meeting_id: reuniao.contractModuleMeetingId,
      };


      // Filter out undefined values to avoid overwriting with null if not intended
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== undefined)
      );


      const { data, error } = await supabase
        .from('meetings')
        .upsert(cleanPayload as any)
        .select();

      if (error) throw error;

      // Se estiver vinculada a um encontro da jornada, atualiza o status desse encontro
      if (reuniao.contractModuleMeetingId) {
        const meetingId = data[0].id;
        // Se a reunião estiver cancelada, o encontro volta para pendente
        const status = reuniao.status === 'realizada' ? 'realizada' : (reuniao.status === 'cancelada' ? 'pendente' : 'agendado');
        const scheduledAt = (reuniao.meetingDate && reuniao.startTime && reuniao.status !== 'cancelada')
          ? `${reuniao.meetingDate}T${reuniao.startTime}` 
          : null;

        await supabase
          .from('contract_module_meetings')
          .update({
            status,
            scheduled_meeting_id: reuniao.status === 'cancelada' ? null : meetingId,
            scheduled_at: scheduledAt,
            consultant_id: reuniao.consultorId,
            completed_at: reuniao.status === 'realizada' ? new Date().toISOString() : null
          })
          .eq('id', reuniao.contractModuleMeetingId);
      }


      return data;

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunioes'] });
      queryClient.invalidateQueries({ queryKey: ['contract-module-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['contract-product-phases'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({ title: 'Sucesso', description: 'Reunião salva com sucesso.' });
    },

    onError: (error: any) => {
      console.error('Erro ao salvar reunião:', error);
      toast({ 
        title: 'Erro ao salvar', 
        description: error.message || 'Ocorreu um erro ao tentar salvar a reunião. Verifique os dados e tente novamente.',
        variant: 'destructive'
      });
    }
  });

  const deleteReuniao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meetings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunioes'] });
      toast({ title: 'Sucesso', description: 'Reunião removida.' });
    },
  });

  return { reunioes, isLoading, error, upsertReuniao, deleteReuniao };
}
