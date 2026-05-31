import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ConsultantCalendlyEventType } from '@/types';

export function useConsultantCalendlyEventTypes(consultantId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: eventTypes, isLoading, error } = useQuery({
    queryKey: ['consultant-calendly-event-types', consultantId],
    queryFn: async () => {
      if (!consultantId) return [];
      const { data, error } = await supabase
        .from('consultant_calendly_event_types' as any)
        .select('*')
        .eq('consultant_id', consultantId);

      if (error) throw error;
      return data as ConsultantCalendlyEventType[];
    },
    enabled: !!consultantId,
  });

  const upsertEventType = useMutation({
    mutationFn: async (eventType: Partial<ConsultantCalendlyEventType>) => {
      const { data, error } = await supabase
        .from('consultant_calendly_event_types' as any)
        .upsert({
          ...eventType,
          consultant_id: consultantId,
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant-calendly-event-types', consultantId] });
      toast({ title: 'Sucesso', description: 'Tipo de evento salvo com sucesso.' });
    },
  });

  const deleteEventType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('consultant_calendly_event_types' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant-calendly-event-types', consultantId] });
      toast({ title: 'Sucesso', description: 'Tipo de evento removido.' });
    },
  });

  return { eventTypes, isLoading, error, upsertEventType, deleteEventType };
}
