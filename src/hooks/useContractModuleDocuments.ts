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
      
      // 1. Fetch documents directly linked to this phase in the main documents table
      const { data: directDocs, error: directError } = await supabase
        .from('documents')
        .select('*')
        .eq('contract_product_phase_id', moduleId);

      if (directError) throw directError;

      // 2. Fetch documents linked via the many-to-many relationship (library documents)
      const { data: contractDocs, error: contractDocsError } = await supabase
        .from('contract_module_documents')
        .select('*, document:documents(*)')
        .eq('module_id', moduleId);

      if (contractDocsError) throw contractDocsError;

      const directDocumentos = (directDocs || []).map((d: any) => ({
        ...d,
        arquivo: d.file_name, // Mapping for compatibility
      })) as Documento[];

      const linkedDocumentos = (contractDocs || [])
        .filter((cd: any) => cd.document)
        .map((cd: any) => ({
          ...cd.document,
          visibility: cd.visibility_type,
          arquivo: cd.document.file_name,
        })) as Documento[];

      // Merge and remove duplicates by ID
      const allDocs = [...directDocumentos, ...linkedDocumentos];
      const uniqueDocs = Array.from(new Map(allDocs.map(item => [item.id, item])).values());
      
      return uniqueDocs;
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
          client_id: (await supabase.from('contracts').select('client_id').eq('id', contractId).single()).data?.client_id,
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
      toast({ title: "Sucesso", description: "Documento vinculado com sucesso." });
    },
  });

  const unlinkDocument = useMutation({
    mutationFn: async (documentId: string) => {
      // We need to decide if we just remove the link or update the document if it's a direct link
      // First try to delete from contract_module_documents
      const { error: unlinkError } = await supabase
        .from('contract_module_documents')
        .delete()
        .eq('module_id', moduleId)
        .eq('document_id', documentId);

      // Also try to clear the contract_product_phase_id if it was a direct link
      const { error: updateError } = await supabase
        .from('documents')
        .update({ contract_product_phase_id: null })
        .eq('id', documentId)
        .eq('contract_product_phase_id', moduleId);

      if (unlinkError && updateError) throw unlinkError || updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-module-documents', moduleId, contractId] });
      toast({ title: "Sucesso", description: "Vínculo removido." });
    },
  });

  return { documents, isLoading, error, linkDocument, unlinkDocument };
}
