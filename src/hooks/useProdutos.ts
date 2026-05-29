import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types';

export function useProdutos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: produtos, isLoading, error } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: p.category,
        service_track_position: p.service_track_position,
        status: (p.status === 'active' ? 'ativo' : p.status === 'inactive' ? 'inativo' : p.status) as 'ativo' | 'inativo',
        consultant_hours: p.consultant_hours ? Number(p.consultant_hours) : undefined,
        silvane_hours: p.silvane_hours ? Number(p.silvane_hours) : undefined,
      })) as Product[];
    },
  });

  const createProduto = useMutation({
    mutationFn: async (newProduto: Partial<Product>) => {
      const { data, error } = await supabase.from('products').insert([newProduto as any]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({ title: 'Sucesso', description: 'Produto criado com sucesso.' });
    },
  });

  const updateProduto = useMutation({
    mutationFn: async (produto: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase.from('products').update(produto as any).eq('id', produto.id).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({ title: 'Sucesso', description: 'Produto atualizado.' });
    },
  });
  
  const deleteProduto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({ title: 'Sucesso', description: 'Produto excluído.' });
    },
    onError: (error: any) => {
      console.error('Error deleting product:', error);
      toast({ 
        variant: "destructive", 
        title: 'Erro ao excluir', 
        description: error.message || 'Ocorreu um erro ao tentar excluir o produto.' 
      });
    },
  });

  return { produtos, isLoading, error, createProduto, updateProduto, deleteProduto };
}
