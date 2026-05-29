import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ClientIndicator } from '@/types';

export function useClienteIndicadores(clientId?: string) {
  const { data: indicadores, isLoading, error } = useQuery({
    queryKey: ['cliente-indicadores', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('client_indicators')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });

      if (error) throw error;

      return data as ClientIndicator[];
    },
    enabled: !!clientId,
  });

  return { indicadores, isLoading, error };
}
