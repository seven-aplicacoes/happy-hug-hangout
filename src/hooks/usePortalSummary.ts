import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePortalSummary(clientId?: string) {
  const { data: summary, isLoading: queryLoading } = useQuery({

    queryKey: ['portal-summary', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      // 1. Fetch all meetings linked to this client's contract modules
      const { data: moduleMeetings, error: mError } = await supabase
        .from('contract_module_meetings')
        .select('status, scheduled_at')
        .eq('client_id', clientId);
        
      if (mError) throw mError;
      
      const total = moduleMeetings.length;
      
      // Statuses considered for realized meetings
      const realizedStatuses = ['realizada', 'concluido', 'concluído', 'completed', 'done', 'finalizada', 'finalizado'];
      
      // Normalize status helper to handle variations
      const normalizeStatus = (status: string) => {
        return String(status || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();
      };

      const realized = moduleMeetings.filter(m => {
        const normalized = normalizeStatus(m.status);
        return realizedStatuses.some(rs => normalizeStatus(rs) === normalized);
      }).length;
      
      // 2. Find the next scheduled meeting (must be in the future and have 'agendado' status)
      const upcomingMeetings = moduleMeetings
        .filter(m => {
          const normalized = normalizeStatus(m.status);
          return (normalized === 'agendado' || normalized === 'agendada') && m.scheduled_at;
        })
        .filter(m => new Date(m.scheduled_at!) > new Date())
        .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());

      const nextMeeting = upcomingMeetings[0];

      return {
        totalMeetings: total,
        realizedMeetings: realized,
        nextMeetingDate: nextMeeting?.scheduled_at || null
      };
    },
    enabled: !!clientId,
  });

  const isLoading = queryLoading && !!clientId;

  return { summary, isLoading };
}

