import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ConsultantProfile = {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'consultor' | 'cliente';
  specialty: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  status: string | null;
  avatar_url: string | null;
  created_at: string | null;
  entry_date?: string | null;
  max_clients?: number;
  hours_available?: number;
  microsoft_teams_connected?: boolean;
  microsoft_teams_account?: string | null;
};

export const useConsultores = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: consultores, isLoading, error } = useQuery({
    queryKey: ['profiles', 'team'],
    queryFn: async () => {
      // Admin path: full profile incl. email/phone (RLS allows admins to read all).
      const { data: adminData, error: adminError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['consultor', 'admin'])
        .order('full_name');

      if (!adminError && adminData && adminData.length > 1) {
        return adminData as ConsultantProfile[];
      }

      // Safe fallback for non-admins: roster without email/phone.
      const { data: safeData, error: safeError } = await supabase.rpc('list_team_members');
      if (safeError) throw safeError;
      return (safeData || [])
        .filter((p: any) => p.role === 'consultor' || p.role === 'admin')
        .map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          email: '',
          role: p.role,
          specialty: p.specialty,
          city: p.city,
          state: p.state,
          status: p.status,
          avatar_url: p.avatar_url,
          created_at: null,
        })) as ConsultantProfile[];
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
