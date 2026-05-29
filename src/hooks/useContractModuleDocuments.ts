import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ContractModuleDocument } from '@/types';

export function useContractModuleDocuments(moduleId?: string, contractId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['contract-module-documents', moduleId, contractId],
    queryFn: async () => {
      if (!moduleId) return [];
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('contract_product_phase_id', moduleId);

      if (error) throw error;

      return (data || []).map((d: any) => ({
        id: d.id,
        clientId: d.client_id,
        contractId: d.contract_id,
        productId: d.contract_product_id,
        moduleId: d.contract_product_phase_id,
        title: d.title,
        description: d.description,
        visibilityType: (d.visibility_type || d.visibility || 'internal') as 'internal' | 'client',
        fileName: d.file_name,
        filePath: d.file_path,
        fileUrl: d.file_url,
        fileType: d.file_type,
        fileSize: Number(d.file_size) || 0,
        uploadedBy: d.uploaded_by,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      })) as ContractModuleDocument[];
    },
    enabled: !!moduleId,
  });

  const uploadDocument = useMutation({
    mutationFn: async ({ 
      file, 
      title, 
      description, 
      visibilityType,
      clientId,
      contractId,
      productId,
      moduleId 
    }: { 
      file: File, 
      title: string, 
      description?: string, 
      visibilityType: 'internal' | 'client',
      clientId: string,
      contractId: string,
      productId: string,
      moduleId: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const filePath = `${clientId}/modules/${moduleId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('documents')
        .insert({
          client_id: clientId,
          contract_id: contractId,
          contract_product_id: productId,
          contract_product_phase_id: moduleId,
          module_id: moduleId,
          title,
          description,
          type: visibilityType === 'client' ? 'entregavel' : 'material',
          visibility: visibilityType === 'client' ? 'client' : 'internal',
          visibility_type: visibilityType,
          file_name: file.name,
          file_path: filePath,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
          author_id: user.id,
          status: 'pendente'
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-module-documents', moduleId, contractId] });
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      toast({ title: 'Sucesso', description: 'Documento enviado com sucesso.' });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (doc: ContractModuleDocument) => {
      // First delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.filePath]);

      if (storageError) console.error('Error removing from storage:', storageError);

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-module-documents', moduleId, contractId] });
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      toast({ title: 'Sucesso', description: 'Documento removido.' });
    },
  });

  const downloadDocument = async (doc: ContractModuleDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: 'Erro ao baixar arquivo',
        description: error.message,
        variant: 'destructive',
        duration: 3000
      });
    }
  };

  return { documents, isLoading, error, uploadDocument, deleteDocument, downloadDocument };
}

