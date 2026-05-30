import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePortalCSAT(clientId?: string) {
  const { data: csatStatus, isLoading } = useQuery({
    queryKey: ['portal-csat-status', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data: meetings, error: meetingsError } = await supabase
        .from('contract_module_meetings')
        .select(`
          id,
          title,
          scheduled_at,
          completed_at,
          status
        `)
        .eq('client_id', clientId)
        .eq('status', 'realizada');

      if (meetingsError) throw meetingsError;

      const { data: responses, error: responsesError } = await supabase
        .from('meeting_csat_responses')
        .select('meeting_id')
        .eq('client_id', clientId);

      if (responsesError) throw responsesError;

      const respondedMeetingIds = new Set(responses.map(r => r.meeting_id));

      return meetings.map(m => ({
        ...m,
        isResponded: respondedMeetingIds.has(m.id)
      }));
    },
    enabled: !!clientId,
  });

  return { csatStatus, isLoading };
}

