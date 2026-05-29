import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Product, FaseMetodologica } from '@/types';

export function useClienteProdutos(clientId?: string) {
  const { data: produtos, isLoading, error } = useQuery({
    queryKey: ['cliente-produtos', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('client_products')
        .select(`
          *,
          product:products (*)
        `)
        .eq('client_id', clientId);

      if (error) throw error;

      return data.map((cp: any) => ({
        id: cp.product_id,
        name: cp.product?.name || 'N/A',
        description: cp.product?.description,
        category: cp.product?.category,
        status: cp.status,
        current_phase: 'diagnostico' as FaseMetodologica, // Fallback
        consultant_hours: cp.product?.consultant_hours,
        silvane_hours: cp.product?.silvane_hours
      }));
    },
    enabled: !!clientId,
  });

  return { produtos, isLoading, error };
}
