import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ClientIndicator } from '@/types';

export function useIndicators(clientId?: string) {
  const queryClient = useQueryClient();

  const { data: indicators, isLoading } = useQuery({
    queryKey: ['client-indicators', clientId],
    queryFn: async () => {
      let query = supabase.from('client_indicators').select('*').order('date', { ascending: false });
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as ClientIndicator[];
    },
  });

  const addIndicatorValue = useMutation({
    mutationFn: async (newIndicator: any) => {
      const { data, error } = await supabase.from('client_indicators').insert([newIndicator]).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-indicators'] });
    },
  });

  return { indicators, isLoading, addIndicatorValue };
}
