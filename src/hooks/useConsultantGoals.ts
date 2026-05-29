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
  period_type: string;
  is_active: boolean;
  consultant_id?: string;
}

export function useConsultantGoals(consultantId?: string) {
  const queryClient = useQueryClient();

  const { data: defaultGoals, isLoading: loadingDefaults } = useQuery({
    queryKey: ['default-indicator-goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('default_indicator_goals')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data as IndicatorGoal[];
    },
  });

  const { data: consultantGoals, isLoading: loadingConsultant } = useQuery({
    queryKey: ['consultant-indicator-goals', consultantId],
    queryFn: async () => {
      if (!consultantId) return [];
      const { data, error } = await supabase
        .from('consultant_indicator_goals')
        .select('*')
        .eq('consultant_id', consultantId)
        .eq('is_active', true);
      if (error) throw error;
      return data as IndicatorGoal[];
    },
    enabled: !!consultantId,
  });

  const upsertConsultantGoal = useMutation({
    mutationFn: async (goal: Partial<IndicatorGoal> & { consultant_id: string; indicator_key: string }) => {
      const { data, error } = await supabase
        .from('consultant_indicator_goals')
        .upsert(goal)
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

  const deleteConsultantGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('consultant_indicator_goals')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant-indicator-goals'] });
      toast.success('Meta removida');
    },
  });

  const restoreDefaults = useMutation({
    mutationFn: async (cId: string) => {
      if (!defaultGoals) return;
      
      const goalsToInsert = defaultGoals.map(dg => ({
        consultant_id: cId,
        indicator_key: dg.indicator_key,
        indicator_label: dg.indicator_label,
        goal_value: dg.default_goal_value,
        goal_type: dg.goal_type,
        comparison_operator: dg.comparison_operator,
        period_type: dg.period_type,
        is_active: true
      }));

      const { error } = await supabase
        .from('consultant_indicator_goals')
        .upsert(goalsToInsert);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant-indicator-goals'] });
      toast.success('Metas padrão restauradas para o consultor');
    },
  });

  // Merged goals: consultant goals override defaults
  const mergedGoals = useMemo(() => {
    if (!defaultGoals) return [];
    if (!consultantGoals || consultantGoals.length === 0) return defaultGoals;

    const goalsMap = new Map<string, IndicatorGoal>();
    defaultGoals.forEach(dg => goalsMap.set(dg.indicator_key, dg));
    consultantGoals.forEach(cg => goalsMap.set(cg.indicator_key, cg));
    
    return Array.from(goalsMap.values());
  }, [defaultGoals, consultantGoals]);

  return {
    defaultGoals,
    consultantGoals,
    mergedGoals,
    isLoading: loadingDefaults || (!!consultantId && loadingConsultant),
    upsertConsultantGoal,
    deleteConsultantGoal,
    restoreDefaults,
  };
}

import { useMemo } from 'react';
