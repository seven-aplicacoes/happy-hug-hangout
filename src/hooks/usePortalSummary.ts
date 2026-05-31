import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePortalSummary(clientId?: string) {
  const { data: summary, isLoading: queryLoading } = useQuery({

    queryKey: ['portal-summary', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data: meetings, error: mError } = await supabase
        .from('contract_module_meetings')
        .select('status, scheduled_at')
        .eq('client_id', clientId);
        
      if (mError) throw mError;
      
      const total = meetings.length;
      const realized = meetings.filter(m => m.status === 'realizada' || m.status === 'concluída' || m.status === 'concluído').length;
      
      const now = new Date();
      const nextMeeting = meetings
        .filter(m => m.status === 'agendado' && m.scheduled_at && new Date(m.scheduled_at) > now)
        .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0];

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

