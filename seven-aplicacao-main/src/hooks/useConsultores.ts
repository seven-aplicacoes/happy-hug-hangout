import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ConsultantProfile = {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'consultor' | 'cliente';
  specialty: string | null;
  city: string | null;
  state: string | null;
  status: string | null;
  avatar_url: string | null;
  created_at: string | null;
  max_clients?: number;
  hours_available?: number;
};

export const useConsultores = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: consultores, isLoading, error } = useQuery({
    queryKey: ['profiles', 'team'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['consultor', 'admin'])
        .order('full_name');


      if (error) throw error;
      return data as ConsultantProfile[];
    },
  });

  const manageMutation = useMutation({
    mutationFn: async ({ action, userData }: { action: 'create' | 'update' | 'delete', userData: any }) => {
      const { data, error } = await supabase.functions.invoke('manage-consultants', {
        body: { action, userData },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profiles', 'team'] });
      const actionMap = {
        create: 'criado',
        update: 'atualizado',
        delete: 'excluído'
      };
      toast({
        title: `Consultor ${actionMap[variables.action]}`,
        description: `O consultor foi ${actionMap[variables.action]} com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na operação",
        description: error.message || "Ocorreu um erro ao processar a solicitação.",
        variant: "destructive",
      });
    },
  });

  return {
    consultores,
    isLoading,
    error,
    createConsultant: (userData: any) => manageMutation.mutateAsync({ action: 'create', userData }),
    updateConsultant: (userData: any) => manageMutation.mutateAsync({ action: 'update', userData }),
    deleteConsultant: (id: string) => manageMutation.mutateAsync({ action: 'delete', userData: { id } }),
    isProcessing: manageMutation.isPending,
  };
};
