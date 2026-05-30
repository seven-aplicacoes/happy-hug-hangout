import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePortalCSAT(clientId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: csatStatus, isLoading: queryLoading } = useQuery({
    queryKey: ['portal-csat-status', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('meeting_csat')
        .select(`
          *,
          meeting:meeting_id (title, meeting_date, start_time)
        `)
        .eq('client_id', clientId)
        .eq('status', 'pending');

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  const submitCSAT = useMutation({
    mutationFn: async (payload: {
      id: string;
      rating_meeting: number;
      rating_consultant: number;
      rating_clarity: number;
      nps_score: number;
      comment: string;
    }) => {
      const { data, error } = await supabase
        .from('meeting_csat')
        .update({
          rating_meeting: payload.rating_meeting,
          rating_consultant: payload.rating_consultant,
          rating_clarity: payload.rating_clarity,
          nps_score: payload.nps_score,
          comment: payload.comment,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', payload.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-csat-status'] });
      queryClient.invalidateQueries({ queryKey: ['portal-summary'] });
      toast({ title: 'Feedback enviado!', description: 'Obrigado por sua avaliação.' });
    },
    onError: (error: any) => {
      console.error(error);
      toast({ title: 'Erro ao enviar feedback', description: error.message, variant: 'destructive' });
    }
  });

  const isLoading = queryLoading && !!clientId;

  return { csatStatus, isLoading, submitCSAT };
}
