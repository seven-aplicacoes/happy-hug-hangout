import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePortalSummary(clientId?: string) {
  const { data: summary, isLoading: queryLoading } = useQuery({

    queryKey: ['portal-summary', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data: meetings, error: mError } = await supabase
        .from('meetings')
        .select('status, meeting_date, start_time')
        .eq('client_id', clientId);
        
      if (mError) throw mError;
      
      const total = meetings.length;
      const realizedStatuses = ['realizada', 'concluido', 'concluído', 'completed', 'done'];
      const realized = meetings.filter(m => realizedStatuses.includes(m.status)).length;
      
      const upcomingMeetings = meetings
        .filter(m => ['agendada', 'agendado', 'reagendada', 'reagendado', 'confirmado', 'em_andamento'].includes(m.status) && m.meeting_date)
        .map(m => ({
          ...m,
          scheduled_at: `${m.meeting_date}T${m.start_time || '00:00'}:00`
        }))
        .filter(m => new Date(m.scheduled_at) > new Date())
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

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

