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
          id,
          title,
          status,
          created_at,
          file_url,
          file_name
        `)
        .eq('client_id', clientId)
        .eq('visibility', 'client')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(d => ({
        id: d.id,
        title: d.title,
        status: d.status || 'entregue',
        date: d.created_at,
        fileUrl: d.file_url,
        fileName: d.file_name
      }));
    },
    enabled: !!clientId,
  });

  return { deliverables, isLoading };
}

