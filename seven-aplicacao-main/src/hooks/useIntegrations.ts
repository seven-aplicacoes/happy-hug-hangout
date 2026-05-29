import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Integration, IntegrationEvent } from '@/types';

export function useIntegrations() {
  const { data: integrations, isLoading: isLoadingIntegrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('integrations').select('*').order('name');
      if (error) throw error;
      return data as Integration[];
    },
  });

  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['integration-events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('integration_events').select('*').order('occurred_at', { ascending: false });
      if (error) throw error;
      return data as IntegrationEvent[];
    },
  });

  return { integrations, events, isLoading: isLoadingIntegrations || isLoadingEvents };
}
