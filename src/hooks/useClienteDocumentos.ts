import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Documento } from '@/types';
import { useDocumentos } from './useDocumentos';

export function useClienteDocumentos(clientId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { downloadFile, deleteDocumento, upsertDocumento } = useDocumentos();

  const { data: documentos, isLoading, error } = useQuery({
    queryKey: ['cliente-documentos', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          client:clients!documents_client_id_fkey (
            id,
            trade_name,
            corporate_name
          ),
          author:profiles!documents_author_id_fkey (
            id,
            full_name
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((d: any) => ({
        id: d.id,
        clienteId: d.client_id,
        clienteNome: d.client?.trade_name || d.client?.corporate_name || 'Desconhecido',
        contractProductId: d.contract_product_id,
        contractProductPhaseId: d.contract_product_phase_id,
        titulo: d.title,
        tipo: d.type,
        data: d.created_at.slice(0, 10),
        arquivo: d.file_name || 'arquivo.pdf',
        file_url: d.file_url,
        file_path: d.file_path,
        file_name: d.file_name,
        file_size: d.file_size,
        file_type: d.file_type,
        uploaded_by: d.uploaded_by,
        uploaded_at: d.uploaded_at,
        status: d.status,
        visibility: d.visibility || 'internal',
        autor: d.author?.full_name || 'Sistema',
        feedbacks: d.feedbacks || [],
      })) as Documento[];
    },
    enabled: !!clientId,
  });

  return { documentos, isLoading, error, downloadFile, deleteDocumento, upsertDocumento };
}
