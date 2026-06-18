import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type FichaSectionKey = 'ficha_cadastral' | 'contratos_jornada' | 'tarefas_cliente' | 'onedrive_cliente';

export interface FichaSection {
  id: string;
  section_key: FichaSectionKey;
  section_label: string;
  display_order: number;
  is_visible: boolean;
}

export const DEFAULT_FICHA_SECTIONS: Omit<FichaSection, 'id'>[] = [
  { section_key: 'ficha_cadastral', section_label: 'Ficha Cadastral', display_order: 1, is_visible: true },
  { section_key: 'contratos_jornada', section_label: 'Contratos e Jornada', display_order: 2, is_visible: true },
  { section_key: 'tarefas_cliente', section_label: 'Tarefas do Cliente', display_order: 3, is_visible: true },
  { section_key: 'onedrive_cliente', section_label: 'OneDrive do Cliente', display_order: 4, is_visible: true },
];

export function useFichaSectionOrder() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['client-profile-section-settings'],
    queryFn: async (): Promise<FichaSection[]> => {
      const { data, error } = await supabase
        .from('client_profile_section_settings' as any)
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      const rows = (data as any[]) || [];
      if (rows.length === 0) {
        return DEFAULT_FICHA_SECTIONS.map((s, i) => ({ ...s, id: `default-${i}` }));
      }
      return rows as FichaSection[];
    },
    staleTime: 60_000,
  });

  const saveOrder = useMutation({
    mutationFn: async (ordered: { section_key: string; display_order: number }[]) => {
      // Update each row's display_order
      const results = await Promise.all(
        ordered.map(o =>
          supabase
            .from('client_profile_section_settings' as any)
            .update({ display_order: o.display_order })
            .eq('section_key', o.section_key)
        )
      );
      const firstError = results.find(r => r.error)?.error;
      if (firstError) throw firstError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-profile-section-settings'] });
    },
  });

  return {
    sections: query.data ?? [],
    isLoading: query.isLoading,
    saveOrder,
  };
}
