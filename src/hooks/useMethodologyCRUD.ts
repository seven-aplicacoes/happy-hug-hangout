import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  MethodologyPhase, 
  MethodologyMaterial, 
  MethodologyNote,
  MethodologyQuestion
} from '@/types';
import { Database } from '@/integrations/supabase/types';

type PhaseUpdate = Database['public']['Tables']['methodology_phases']['Update'];

export interface TransversalMaterial {
  id: string;
  title: string;
  description?: string;
  category: string;
  file_name?: string;
  file_url?: string;
  file_path?: string;
  file_type?: string;
  file_size?: number;
  status: string;
  order_index: number;
  updated_at: string;
}

export function useMethodologyCRUD() {
  const queryClient = useQueryClient();

  const { data: phases, isLoading: isLoadingPhases } = useQuery({
    queryKey: ['methodology-phases-crud'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('methodology_phases')
        .select(`
          *,
          objectives:methodology_phase_objectives(*),
          deliverables:methodology_phase_deliverables(*),
          tools:methodology_phase_tools(*),
          materials:methodology_materials(*)
        `)
        .order('order_index');
      if (error) throw error;
      return data;
    },
  });

  const { data: transversalMaterials, isLoading: isLoadingTransversal } = useQuery({
    queryKey: ['methodology-transversal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('methodology_transversal_materials')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return data as TransversalMaterial[];
    },
  });

  const updatePhaseMutation = useMutation({
    mutationFn: async (phase: Partial<MethodologyPhase> & { id: string }) => {
      const { error } = await supabase
        .from('methodology_phases')
        .update(phase)
        .eq('id', phase.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['methodology-phases-crud'] });
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('methodology_materials')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['methodology-phases-crud'] });
    },
  });

  return {
    phases,
    transversalMaterials,
    isLoading: isLoadingPhases || isLoadingTransversal,
    updatePhase: updatePhaseMutation.mutateAsync,
    deleteMaterial: deleteMaterialMutation.mutateAsync,
  };
}
