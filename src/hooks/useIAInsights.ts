import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface IAInsight {
  id: string;
  client_id?: string;
  titulo: string;
  descricao: string;
  tipo: string;
  variant: 'success' | 'warning' | 'danger' | 'info';
  confianca: number;
  created_at: string;
  acaoLabel?: string;
  acaoHref?: string;
}

export function useIAInsights(clientId?: string) {
  return useQuery({
    queryKey: ['ia-insights', clientId],
    queryFn: async () => {
      let query = supabase.from('ia_insights').select('*').order('created_at', { ascending: false });
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((ins: any) => ({
        id: ins.id,
        client_id: ins.client_id,
        titulo: ins.title,
        descricao: ins.description,
        tipo: ins.type,
        variant: (ins.variant || 'info') as IAInsight['variant'],
        confianca: ins.confidence || 0,
        created_at: ins.created_at,
        acaoLabel: 'Ver detalhes', // Default label
        acaoHref: ins.client_id ? `/admin/cliente/${ins.client_id}` : undefined
      })) as IAInsight[];
    },
  });
}

