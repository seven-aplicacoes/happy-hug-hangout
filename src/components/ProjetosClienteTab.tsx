import { useClientProducts } from '@/hooks/useClientProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';
import { DataTable, Column } from '@/components/DataTable';
import { StatusTag } from '@/components/StatusTag';
import { labelStatus } from '@/data/mockData';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Clock, ChevronRight } from 'lucide-react';

interface Props {
  clientId: string;
}

const ProductPhases = ({ productId }: { productId: string }) => {
  const { phases, isLoading } = useContractProductPhases(productId);

  if (isLoading) return <Skeleton className="h-20 w-full mt-2" />;
  if (!phases || phases.length === 0) return null;

  return (
    <div className="mt-4 space-y-2 pl-4 border-l-2 border-primary/20 ml-2">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
        <Clock className="h-3 w-3" /> Jornada de Execução
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {phases.map((phase) => (
          <div key={phase.id} className="bg-background rounded-md border p-3 shadow-sm hover:border-primary/40 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-semibold truncate flex-1 pr-2">{phase.name}</span>
              <Badge variant={phase.status === 'concluida' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1">
                {phase.status}
              </Badge>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{phase.startDate ? new Date(phase.startDate).toLocaleDateString() : '—'} até {phase.endDate ? new Date(phase.endDate).toLocaleDateString() : '—'}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{phase.responsibleConsultantNome || 'Não atribuído'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProjetosClienteTab = ({ clientId }: Props) => {
  const { clientProducts, isLoading } = useClientProducts(clientId);
  const data = clientProducts || [];

  if (isLoading) return <Skeleton className="h-[200px] w-full" />;

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">Nenhum produto contratado vinculado a este cliente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Contratos e Jornada de Execução</h3>
      </div>
      
      <div className="space-y-6">
        {data.map((p) => (
          <Card key={p.id} className="overflow-hidden border-2">
            <CardHeader className="bg-muted/30 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{p.productNome || 'N/A'}</CardTitle>
                    <StatusTag label={(labelStatus as any)[p.status] || p.status} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="font-normal">{p.contractTipo || 'Contrato'}</Badge>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.startDate ? new Date(p.startDate).toLocaleDateString() : '—'} - {p.endDate ? new Date(p.endDate).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Usuário Responsável</p>
                        <p className="text-sm font-medium">{p.consultantNome || 'N/A'}</p>
                    </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ProductPhases productId={p.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};