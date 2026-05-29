import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface MeetingCSAT {
  id: string;
  meeting_id: string;
  client_id: string;
  contract_id?: string;
  consultant_id?: string;
  rating_meeting?: number;
  rating_consultant?: number;
  rating_clarity?: number;
  nps_score?: number;
  comment?: string;
  submitted_at: string;
  created_at: string;
}

export function useClientCSAT(clientId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: responses, isLoading } = useQuery({
    queryKey: ['client-csat-responses', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('meeting_csat_responses')
        .select('*')
        .eq('client_id', clientId);
      if (error) throw error;
      return data as MeetingCSAT[];
    },
    enabled: !!clientId,
  });

  const submitCSAT = useMutation({
    mutationFn: async (csat: Omit<MeetingCSAT, 'id' | 'created_at' | 'submitted_at'>) => {
      const { data, error } = await supabase
        .from('meeting_csat_responses')
        .insert({
          ...csat,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-csat-responses', clientId] });
      toast({ title: 'Obrigado!', description: 'Seu feedback foi enviado com sucesso.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao enviar feedback', description: error.message, variant: 'destructive' });
    },
  });

  return { responses, isLoading, submitCSAT };
}
