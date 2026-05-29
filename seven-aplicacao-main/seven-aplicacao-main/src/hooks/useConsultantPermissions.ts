import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ConsultantPermission {
  id: string;
  consultant_id: string;
  module_key: string;
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  created_at: string;
  updated_at: string;
}

export function useConsultantPermissions(consultantId?: string) {
  const queryClient = useQueryClient();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['consultant-permissions', consultantId],
    queryFn: async () => {
      if (!consultantId) return [];
      const { data, error } = await supabase
        .from('consultant_permissions')
        .select('*')
        .eq('consultant_id', consultantId);

      if (error) throw error;
      return data as ConsultantPermission[];
    },
    enabled: !!consultantId,
  });

  const updatePermission = useMutation({
    mutationFn: async (permission: Partial<ConsultantPermission> & { id: string }) => {
      const { data, error } = await supabase
        .from('consultant_permissions')
        .update(permission)
        .eq('id', permission.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant-permissions', consultantId] });
      toast.success('Permissão atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Error updating permission:', error);
      toast.error('Erro ao atualizar permissão');
    },
  });

  const restoreDefaults = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('seed_default_consultant_permissions', {
        p_consultant_id: id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant-permissions', consultantId] });
      toast.success('Permissões restauradas para o padrão');
    },
    onError: (error) => {
      console.error('Error restoring permissions:', error);
      toast.error('Erro ao restaurar permissões');
    },
  });

  return {
    permissions,
    isLoading,
    updatePermission,
    restoreDefaults,
  };
}

export function useMyPermissions() {
  const { data: permissions, isLoading } = useQuery({
    queryKey: ['my-permissions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role === 'admin') {
        // Admins have all permissions
        return 'admin' as const;
      }

      const { data, error } = await supabase
        .from('consultant_permissions')
        .select('*')
        .eq('consultant_id', user.id);

      if (error) throw error;
      return data as ConsultantPermission[];
    },
  });

  const can = (moduleKey: string, action: 'view' | 'create' | 'edit' | 'delete' | 'export' = 'view') => {
    if (isLoading) return true; // Default to true while loading to avoid flickering
    if (permissions === 'admin') return true;
    if (!permissions || !Array.isArray(permissions)) return false;
    
    const permission = permissions.find(p => p.module_key === moduleKey);
    if (!permission) return false;

    switch (action) {
      case 'view': return permission.can_view;
      case 'create': return permission.can_create;
      case 'edit': return permission.can_edit;
      case 'delete': return permission.can_delete;
      case 'export': return permission.can_export;
      default: return false;
    }
  };

  return {
    permissions,
    isLoading,
    can,
  };
}
