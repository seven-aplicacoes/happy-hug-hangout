import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Documento } from '@/types';

export function useContractModuleDocuments(moduleId?: string, contractId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['contract-module-documents', moduleId, contractId],
    queryFn: async () => {
      if (!moduleId) return [];
      
      // Fetch both generic module documents and client-specific documents
      const { data: contractDocs, error: contractDocsError } = await supabase
        .from('contract_module_documents')
        .select('*, document:documents(*)')
        .eq('module_id', moduleId);

      if (contractDocsError) throw contractDocsError;

      // Also could fetch generic documents linked to the base methodology module
      // But for now let's focus on contract-specific ones as per user request
      
      return (contractDocs || []).map((cd: any) => ({
        ...cd.document,
        visibility: cd.visibility_type,
        // map other fields if needed
      })) as Documento[];
    },
    enabled: !!moduleId,
  });

  const linkDocument = useMutation({
    mutationFn: async ({ documentId, visibilityType }: { documentId: string, visibilityType: 'internal' | 'client' }) => {
      if (!moduleId || !contractId) return;
      
      const { data, error } = await supabase
        .from('contract_module_documents')
        .upsert({
          contract_id: contractId,
          client_id: (await supabase.from('contracts').select('cliente_id').eq('id', contractId).single()).data?.cliente_id,
          module_id: moduleId,
          document_id: documentId,
          visibility_type: visibilityType
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-module-documents', moduleId, contractId] });
    },
  });

  const unlinkDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('contract_module_documents')
        .delete()
        .eq('module_id', moduleId)
        .eq('document_id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-module-documents', moduleId, contractId] });
    },
  });

  return { documents, isLoading, error, linkDocument, unlinkDocument };
}
