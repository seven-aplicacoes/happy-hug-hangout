import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MethodologyPhase, MethodologyMaterial, MethodologyTemplate, MethodologyQuestion } from '@/types';

export function useMethodology() {
  const { data: phases, isLoading: isLoadingPhases } = useQuery({
    queryKey: ['methodology-phases'],
    queryFn: async () => {
      const { data, error } = await supabase.from('methodology_phases').select('*').order('order_index');
      if (error) throw error;
      return data as MethodologyPhase[];
    },
  });

  const { data: materials, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['methodology-materials'],
    queryFn: async () => {
      const { data, error } = await supabase.from('methodology_materials').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      return data as MethodologyMaterial[];
    },
  });

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['methodology-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('methodology_templates').select('*');
      if (error) throw error;
      return data as MethodologyTemplate[];
    },
  });

  const { data: questions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['methodology-questions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('methodology_questions').select('*');
      if (error) throw error;
      return data as MethodologyQuestion[];
    },
  });

  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['methodology-plans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('methodology_plans').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: planPhases, isLoading: isLoadingPlanPhases } = useQuery({
    queryKey: ['methodology-plan-phases'],
    queryFn: async () => {
      const { data, error } = await supabase.from('methodology_plan_phases').select('*').order('order_index');
      if (error) throw error;
      return (data || []).map((p: any) => ({
        id: p.id,
        productId: p.product_id,
        name: p.name,
        orderIndex: p.order_index,
        durationMinutes: p.duration_minutes,
        executorType: p.executor_type,
        meetingsCount: p.meetings_count,
        purpose: p.purpose,
        phase_key: p.phase_key
      }));
    }
  });
 

  return { 
    phases, 
    materials, 
    templates, 
    questions, 
    plans,
    planPhases,
    isLoading: isLoadingPhases || isLoadingMaterials || isLoadingTemplates || isLoadingQuestions || isLoadingPlans || isLoadingPlanPhases
  };
}
