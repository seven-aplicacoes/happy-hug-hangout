import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useMethodologyHierarchy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getPlans = useQuery({
    queryKey: ['methodology-plans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('methodology_plans').select('*').order('order_index');
      if (error) throw error;
      return data;
    }
  });

  const getPhases = (planId?: string) => useQuery({
    queryKey: ['methodology-phases', planId],
    queryFn: async () => {
      let query = supabase.from('methodology_plan_phases').select('*').order('order_index');
      if (planId) query = query.eq('methodology_plan_id', planId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!planId || planId === undefined
  });

  const getModules = (phaseId?: string) => useQuery({
    queryKey: ['methodology-modules', phaseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('methodology_plan_modules').select('*').eq('phase_id', phaseId).order('order_index');
      if (error) throw error;
      return data;
    },
    enabled: !!phaseId
  });

  const getMeetings = (moduleId?: string) => useQuery({
    queryKey: ['methodology-meetings', moduleId],
    queryFn: async () => {
      const { data, error } = await supabase.from('methodology_plan_meetings').select('*').eq('module_id', moduleId).order('order_index');
      if (error) throw error;
      return data;
    },
    enabled: !!moduleId
  });

  return { getPlans, getPhases, getModules, getMeetings };
}
