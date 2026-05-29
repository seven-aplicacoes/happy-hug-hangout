import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { ConsultorProfileView } from '@/components/ConsultorProfileView';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useConsultores } from '@/hooks/useConsultores';

export default function AdminConsultorDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { consultores } = useConsultores();
  const consultor = consultores?.find(c => c.id === id);

  const handleBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate('/admin/consultores');
  };

  return (
    <div className="space-y-12">
      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground flex items-center gap-1.5">
        <button onClick={() => navigate('/admin/consultores')} className="hover:text-foreground transition-colors">
          Usuários
        </button>
        <span>/</span>
        <span className="text-foreground">{consultor?.full_name || 'Detalhes'}</span>
      </nav>

      <PageHeader titulo="Detalhes do Usuário" subtitulo="Visão gerencial completa">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </PageHeader>
      <ConsultorProfileView
        consultorId={id || ''}
        modo="admin"
        onExportar={() => toast({ title: 'Exportação', description: 'Visão exportada com sucesso.' })}
      />
    </div>
  );
}
