import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { ConsultorProfileView } from '@/components/ConsultorProfileView';
import { useMyPermissions } from '@/hooks/useConsultantPermissions';
import { Loader2, AlertCircle } from 'lucide-react';

export default function ConsultorMeuPerfilPage() {
   const { user } = useAuth();
   const { can, isLoading } = useMyPermissions();

    if (isLoading || !user) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      );
    }

    if (!can('perfil')) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <p className="text-lg font-medium">Você não tem permissão para acessar este módulo.</p>
        </div>
      );
    }

  return (
    <div className="space-y-12">
      <PageHeader titulo="Meu Perfil" subtitulo="Sua visão operacional e indicadores" />
      <ConsultorProfileView
        consultorId={user?.consultorId || 'c1'}
        modo="consultor"
      />
    </div>
  );
}
