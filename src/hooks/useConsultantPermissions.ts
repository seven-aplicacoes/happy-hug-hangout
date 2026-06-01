import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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

export const CONSULTANT_MODULES_CONFIG = [
  { key: 'dashboard', path: '/consultor/dashboard' },
  { key: 'clientes', path: '/consultor/clientes' },
  { key: 'reunioes', path: '/consultor/reunioes' },
  { key: 'tarefas', path: '/consultor/tarefas' },
  { key: 'documentos', path: '/consultor/documentos' },
  { key: 'metodologia', path: '/consultor/metodologia' },
  { key: 'perfil', path: '/consultor/meu-perfil' },
];

export const ADMIN_MODULES_CONFIG = [
  { key: 'dashboard', path: '/admin/dashboard' },
  { key: 'clientes', path: '/admin/clientes' },
  { key: 'contratos', path: '/admin/contratos' },
  { key: 'produtos', path: '/admin/produtos' },
  { key: 'reunioes', path: '/admin/reunioes' },
  { key: 'tarefas', path: '/admin/tarefas' },
  { key: 'documentos', path: '/admin/documentos' },
  { key: 'notificacoes', path: '/admin/notificacoes' },
  { key: 'analise-avancada', path: '/admin/analise-avancada' },
  { key: 'mapa-carteira', path: '/admin/mapa-carteira' },
  { key: 'consultores', path: '/admin/consultores' },
  { key: 'permissoes-consultores', path: '/admin/permissoes-consultores' },
  { key: 'metas-consultores', path: '/admin/metas-consultores' },
  { key: 'metodologia', path: '/admin/metodologia' },
  { key: 'integracoes', path: '/admin/integracoes' },
  { key: 'ia', path: '/admin/ia' },
  { key: 'inteligencia', path: '/admin/inteligencia' },
  { key: 'relacionamento', path: '/admin/relacionamento' },
  { key: 'pipeline', path: '/admin/pipeline' },
  { key: 'renovacao', path: '/admin/renovacao' },
  { key: 'alertas', path: '/admin/alertas' },
];

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
  const { user: authUser, perfil } = useAuth();
  const { data: permissions, isLoading } = useQuery({
    queryKey: ['my-permissions', authUser?.id, perfil],
    queryFn: async () => {
      console.log("[PERMISSIONS_CHECK_START]", { userId: authUser?.id, perfil });
      if (!authUser) return [];
      
      // Se for perfil cliente, não precisamos buscar na tabela de permissões de consultores
      if (perfil === 'cliente' || authUser.role === 'cliente') {
        console.log("[PERMISSIONS_CLIENT_BYPASS]");
        return 'client_bypass' as any;
      }

      const user = authUser;

      // Check if user is admin
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profError) {
        console.error("[PROFILE_LOAD_ERROR]", profError);
      }

      const { data: permissionData, error: permError } = await supabase
        .from('consultant_permissions')
        .select('*')
        .eq('consultant_id', user.id);

      if (permError) {
        console.error("[PERMISSIONS_LOAD_ERROR]", permError);
        throw permError;
      }

      console.log("[PERMISSIONS_LOADED]", { count: permissionData?.length, role: profile?.role });

      if (permissionData && permissionData.length > 0) {
        return permissionData as ConsultantPermission[];
      }

      if (profile?.role === 'admin') {
        return 'admin' as const;
      }

      return [] as ConsultantPermission[];
    },
    enabled: !!authUser,
  });

  const can = (moduleKey: string, action: 'view' | 'create' | 'edit' | 'delete' | 'export' = 'view') => {
    if (isLoading) return true; 
    if (permissions === 'admin' || perfil === 'admin' || permissions === 'client_bypass') return true;
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

  const getFirstAllowedRoute = () => {
    if (isLoading) return null;
    if (permissions === 'admin') return perfil === 'admin' ? ADMIN_MODULES_CONFIG[0].path : CONSULTANT_MODULES_CONFIG[0].path;
    if (!permissions || !Array.isArray(permissions)) return '/no-access';

    const config = perfil === 'admin' ? ADMIN_MODULES_CONFIG : CONSULTANT_MODULES_CONFIG;
    const allowedModules = config.filter(m => can(m.key));
    
    if (allowedModules.length > 0) return allowedModules[0].path;
    
    // If not found in primary config, check the other one
    const otherConfig = perfil === 'admin' ? CONSULTANT_MODULES_CONFIG : ADMIN_MODULES_CONFIG;
    const allowedInOther = otherConfig.filter(m => can(m.key));
    if (allowedInOther.length > 0) return allowedInOther[0].path;
    
    return '/no-access';
  };

  return {
    permissions,
    isLoading,
    can,
    getFirstAllowedRoute,
  };
}
