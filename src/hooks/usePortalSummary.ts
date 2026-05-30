import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePortalSummary(clientId: string | undefined) {
  return useQuery({
    queryKey: ['portal-summary', clientId],
    queryFn: async () => {
      if (!clientId) return null;

      const { data: meetings, error } = await supabase
        .from('contract_module_meetings')
        .select('*')
        .eq('client_id', clientId);

      if (error) throw error;

      const totalMeetings = meetings.length;
      const realizedMeetings = meetings.filter(m => m.status === 'realizada').length;
      
      const nextMeeting = meetings
        .filter(m => m.status === 'agendado' && m.scheduled_at)
        .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0];

      return {
        totalMeetings,
        realizedMeetings,
        nextMeetingDate: nextMeeting?.scheduled_at || null
      };
    },
    enabled: !!clientId,
  });
}
