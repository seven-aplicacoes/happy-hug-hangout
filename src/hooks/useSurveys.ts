import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSurveys(consultantId?: string) {
  const { data: csatSurveys, isLoading: loadingCsat } = useQuery({
    queryKey: ['csat_surveys', consultantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('csat_surveys')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: npsSurveys, isLoading: loadingNps } = useQuery({
    queryKey: ['nps_surveys', consultantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nps_surveys')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  return {
    csatSurveys,
    npsSurveys,
    isLoading: loadingCsat || loadingNps,
  };
}
