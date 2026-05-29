import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface KPITarget {
  id: string;
  consultant_id: string;
  kpi_key: string;
  target_value: number;
  target_unit?: string | null;
  comparison_operator: string;
  description?: string | null;
  active: boolean;
}

export function useKPITargets(consultantId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const idToUse = consultantId || user?.consultorId;

  const { data: targets, isLoading } = useQuery({
    queryKey: ['kpi_targets', idToUse],
    queryFn: async () => {
      if (!idToUse) return [];
      const { data, error } = await supabase
        .from('consultant_kpi_targets')
        .select('*')
        .eq('consultant_id', idToUse)
        .eq('active', true);

      if (error) throw error;
      return data as KPITarget[];
    },
    enabled: !!idToUse,
  });

  const upsertTarget = useMutation({
    mutationFn: async (target: Partial<KPITarget>) => {
      const { data, error } = await supabase
        .from('consultant_kpi_targets')
        .upsert({
          ...target,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi_targets'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar meta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return { targets, isLoading, upsertTarget };
}
