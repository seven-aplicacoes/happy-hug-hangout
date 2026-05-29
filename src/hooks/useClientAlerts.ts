import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ClientAlert } from '@/types';

export function useClientAlerts(clientId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['client-alerts', clientId],
    queryFn: async () => {
      let query = supabase.from('client_alerts').select('*').order('created_at', { ascending: false });
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as ClientAlert[];
    },
  });

  const createAlert = useMutation({
    mutationFn: async (newAlert: any) => {
      const { data, error } = await supabase.from('client_alerts').insert([newAlert]).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-alerts'] });
      toast({ title: 'Alerta criado', description: 'O alerta foi registrado com sucesso.' });
    },
  });

  const updateAlertStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: ClientAlert['status'] }) => {
      const { data, error } = await supabase.from('client_alerts').update({ status }).eq('id', id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-alerts'] });
    },
  });

  return { alerts, isLoading, createAlert, updateAlertStatus };
}
