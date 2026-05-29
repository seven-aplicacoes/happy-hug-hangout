import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IndicatorGoal {
  id: string;
  indicator_key: string;
  indicator_label: string;
  goal_value: number;
  goal_type: 'minimum' | 'maximum' | 'target' | 'informational';
  comparison_operator: 'greater_or_equal' | 'less_or_equal' | 'equal' | 'none';
  period_type: 'weekly' | 'monthly';
  is_active: boolean;
  is_per_client: boolean;
  consultant_id?: string;
}

export const KPI_CONFIGS = [
  { key: 'meetings_completed', label: 'Reuniões Realizadas', perClient: false },
  { key: 'csat_responses', label: 'CSAT Respostas', perClient: false },
  { key: 'csat_adherence', label: 'Adesão CSAT', perClient: false },
  { key: 'csat_score', label: 'Nota CSAT', perClient: false },
  { key: 'nps', label: 'NPS', perClient: false },
  { key: 'meetings_per_client', label: 'Encontros por Cliente', perClient: true },
];

export function useConsultantGoals(consultantId?: string) {
  const queryClient = useQueryClient();

  const { data: consultantGoals, isLoading } = useQuery({
    queryKey: ['consultant-indicator-goals', consultantId],
    queryFn: async () => {
      if (!consultantId) return [];
      const { data, error } = await supabase
        .from('consultant_indicator_goals')
        .select('*')
        .eq('consultant_id', consultantId)
        .order('indicator_label', { ascending: true });
      
      if (error) throw error;
      return data as unknown as IndicatorGoal[];
    },
    enabled: !!consultantId,
  });

  const upsertConsultantGoal = useMutation({
    mutationFn: async (goal: any) => {
      const { data, error } = await supabase
        .from('consultant_indicator_goals')
        .upsert({
          ...goal,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant-indicator-goals'] });
      toast.success('Meta atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Error upserting goal:', error);
      toast.error('Erro ao salvar meta');
    },
  });

  return {
    consultantGoals,
    mergedGoals: (consultantGoals || []).filter(g => g.is_active),
    isLoading,
    upsertConsultantGoal,
  };
}
