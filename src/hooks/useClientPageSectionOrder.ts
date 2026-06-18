import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ClientSectionKey =
  | 'ficha_cadastral'
  | 'contratos_jornada'
  | 'tarefas_cliente'
  | 'onedrive_cliente';

export const DEFAULT_SECTION_ORDER: ClientSectionKey[] = [
  'ficha_cadastral',
  'contratos_jornada',
  'tarefas_cliente',
  'onedrive_cliente',
];

function sanitize(order: unknown): ClientSectionKey[] {
  if (!Array.isArray(order)) return DEFAULT_SECTION_ORDER;
  const valid = order.filter((k): k is ClientSectionKey =>
    DEFAULT_SECTION_ORDER.includes(k as ClientSectionKey)
  );
  // ensure all 4 present
  for (const k of DEFAULT_SECTION_ORDER) {
    if (!valid.includes(k)) valid.push(k);
  }
  return valid.slice(0, 4);
}

export function useClientPageSectionOrder() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['user-client-page-prefs', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_client_page_preferences')
        .select('section_order')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return sanitize(data?.section_order);
    },
  });

  const save = useMutation({
    mutationFn: async (order: ClientSectionKey[]) => {
      if (!user?.id) throw new Error('Sem usuário');
      const { error } = await supabase
        .from('user_client_page_preferences')
        .upsert(
          { user_id: user.id, section_order: sanitize(order) },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-client-page-prefs', user?.id] });
    },
  });

  const reset = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Sem usuário');
      const { error } = await supabase
        .from('user_client_page_preferences')
        .upsert(
          { user_id: user.id, section_order: DEFAULT_SECTION_ORDER },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-client-page-prefs', user?.id] });
    },
  });

  return {
    order: query.data ?? DEFAULT_SECTION_ORDER,
    isLoading: query.isLoading,
    save: save.mutateAsync,
    saving: save.isPending,
    reset: reset.mutateAsync,
    resetting: reset.isPending,
  };
}
