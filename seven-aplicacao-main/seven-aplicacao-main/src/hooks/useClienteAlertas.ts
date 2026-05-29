import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ClientAlert } from '@/types';

export function useClienteAlertas(clientId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alertas, isLoading, error } = useQuery({
    queryKey: ['cliente-alertas', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('client_alerts')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as ClientAlert[];
    },
    enabled: !!clientId,
  });

  const resolverAlerta = useMutation({
    mutationFn: async (alertaId: string) => {
      const { data, error } = await supabase
        .from('client_alerts')
        .update({ status: 'resolved' })
        .eq('id', alertaId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-alertas', clientId] });
      toast({ title: 'Sucesso', description: 'Alerta resolvido.' });
    },
  });

  return { alertas, isLoading, error, resolverAlerta };
}
