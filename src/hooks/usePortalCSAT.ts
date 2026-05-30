import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePortalCSAT(clientId?: string) {
  const { data: csatStatus, isLoading } = useQuery({
    queryKey: ['portal-csat-status', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      // Get all meetings for this client that are 'realizada' and have csat_enabled = true
      // and check if they already have a response
      const { data: meetings, error: meetingsError } = await supabase
        .from('contract_module_meetings')
        .select(`
          id,
          title,
          scheduled_at,
          completed_at,
          csat_enabled,
          module:contract_product_phases(name),
          product:contract_products(product_name)
        `)
        .eq('client_id', clientId)
        .eq('status', 'realizada')
        .eq('csat_enabled', true);

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
