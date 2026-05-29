import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Documento } from '@/types';

export function useDocumentos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documentos, isLoading, error } = useQuery({
    queryKey: ['documentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          client:client_id (trade_name),
          profile:uploaded_by (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        id: d.id,
        clienteId: d.client_id,
        clienteNome: d.client?.trade_name || 'Desconhecido',
        contractProductId: d.contract_product_id,
        contractProductPhaseId: d.contract_product_phase_id,
        titulo: d.title,
        tipo: d.type,
        data: d.created_at,
        arquivo: d.file_name,
        file_url: d.file_url,
        file_path: d.file_path,
        file_name: d.file_name,
        file_size: d.file_size,
        file_type: d.file_type,
        uploaded_by: d.uploaded_by,
        uploaded_at: d.created_at,
        status: d.status,
        visibility: d.visibility,
        autor: d.profile?.full_name || 'Desconhecido',
        feedbacks: [],
      })) as Documento[];
    },
  });

  const upsertDocumento = useMutation({
    mutationFn: async ({ doc, file }: { doc: Partial<Documento>, file?: File }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let filePath = doc.file_path;
      let fileUrl = doc.file_url;
      let fileName = doc.file_name;
      let fileSize = doc.file_size;
      let fileType = doc.file_type;

      if (file) {
        fileName = file.name;
        fileSize = file.size;
        fileType = file.type;
        const fileExt = fileName.split('.').pop();
        filePath = `${doc.clienteId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);
        
        fileUrl = publicUrl;
      }

      const payload: any = {
        id: doc.id,
        client_id: doc.clienteId,
        contract_product_id: doc.contractProductId,
        contract_product_phase_id: doc.contractProductPhaseId,
        title: doc.titulo,
        type: doc.tipo,
        file_name: fileName,
        file_url: fileUrl,
        file_path: filePath,
        file_size: fileSize,
        file_type: fileType,
        status: doc.status || 'pendente',
        visibility: doc.visibility || 'all',
        uploaded_by: user?.id,
      };

      const { data, error } = await supabase
        .from('documents')
        .upsert(payload)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      queryClient.invalidateQueries({ queryKey: ['cliente-documentos'] });
      toast({ title: 'Sucesso', description: 'Documento salvo com sucesso.' });
    },
  });

  const deleteDocumento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      queryClient.invalidateQueries({ queryKey: ['cliente-documentos'] });
      toast({ title: 'Sucesso', description: 'Documento removido.' });
    },
  });

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: 'Erro ao baixar arquivo',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return { documentos, isLoading, error, upsertDocumento, deleteDocumento, downloadFile };
}
