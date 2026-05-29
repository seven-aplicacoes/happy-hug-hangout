import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusTag } from '@/components/StatusTag';
import { useClienteAlertas } from '@/hooks/useClienteAlertas';
import { ShieldAlert, Sparkles } from 'lucide-react';

interface Props {
  clienteId: string;
}

export function AlertasClienteCard({ clienteId }: Props) {
  const { alertas = [], isLoading } = useClienteAlertas(clienteId);
  
  if (isLoading) return <div className="p-4 text-center text-sm text-muted-foreground">Carregando alertas...</div>;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" strokeWidth={1.5} />
          Alertas comportamentais
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alertas.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
            <Sparkles className="h-4 w-4 text-seven-success" strokeWidth={1.5} />
            Nenhum sinal de risco identificado neste momento.
          </div>
        ) : (
          <ul className="space-y-3">
            {alertas.map((a) => (
              <li key={a.id} className="border-l-2 border-border pl-3 py-1">
                <div className="flex items-center gap-2 mb-1">
                  <StatusTag label={a.type} variant={a.severity === 'alta' ? 'danger' : a.severity === 'media' ? 'warning' : 'success'} />
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {a.severity === 'alta' ? 'Alta criticidade' : a.severity === 'media' ? 'Média' : 'Baixa'}
                  </span>
                </div>
                <p className="text-sm text-foreground"><span className="text-muted-foreground">Motivo: </span>{a.reason}</p>
                <p className="text-xs text-foreground/80 mt-0.5"><span className="text-muted-foreground">Próxima ação: </span>{a.next_action}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 italic">{a.evidence}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
