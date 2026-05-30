import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePortalDeliverables(clientId?: string) {
  const { data: deliverables, isLoading } = useQuery({
    queryKey: ['portal-deliverables', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          module:contract_product_phases(name),
          product:contract_products(product_name)
        `)
        .eq('client_id', clientId)
        .eq('visibility', 'client')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(d => ({
        id: d.id,
        title: d.title,
        description: d.description,
        status: d.status || 'entregue',
        date: d.created_at,
        fileUrl: d.file_url,
        fileName: d.file_name,
        moduleName: d.module?.name,
        productName: d.product?.product_name
      }));
    },
    enabled: !!clientId,
  });

  return { deliverables, isLoading };
}
