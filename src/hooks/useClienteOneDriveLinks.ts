import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface OneDriveLink {
  id: string;
  client_id: string;
  title: string;
  url: string;
  category: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OneDriveLinkInput {
  id?: string;
  client_id: string;
  title: string;
  url: string;
  category?: string | null;
  description?: string | null;
}

export function useClienteOneDriveLinks(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ['cliente-onedrive-links', clientId];

  const { data: links, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('client_onedrive_links')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as OneDriveLink[];
    },
    enabled: !!clientId,
  });

  const upsertLink = useMutation({
    mutationFn: async (input: OneDriveLinkInput) => {
      const payload = {
        client_id: input.client_id,
        title: input.title.trim(),
        url: input.url.trim(),
        category: input.category || null,
        description: input.description || null,
        ...(input.id ? {} : { created_by: user?.id || null }),
      };
      if (input.id) {
        const { error } = await supabase
          .from('client_onedrive_links')
          .update(payload)
          .eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_onedrive_links')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({ title: vars.id ? 'Link atualizado' : 'Link do OneDrive salvo com sucesso.' });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Não foi possível salvar o link. Tente novamente.',
      });
    },
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('client_onedrive_links')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({ title: 'Link removido.' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Não foi possível remover o link.' });
    },
  });

  return { links: links || [], isLoading, upsertLink, deleteLink };
}
