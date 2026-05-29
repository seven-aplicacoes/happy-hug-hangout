import { Card, CardContent } from '@/components/ui/card';
import { getMatrizRisco } from '@/data/inteligenciaAvancada';
import { SectionHeader } from '@/components/SectionHeader';
import { cn } from '@/lib/utils';

const buckets = ['0-7d', '8-15d', '16-30d', '+30d'] as const;
const fases: { key: string; label: string }[] = [
  { key: 'diagnostico', label: 'Diagnóstico' },
  { key: 'planejamento', label: 'Planejamento' },
  { key: 'estruturacao', label: 'Estruturação' },
  { key: 'monitoramento', label: 'Monitoramento' },
  { key: 'encerramento', label: 'Encerramento' },
];

function cellColor(b: string, qtd: number) {
  if (qtd === 0) return 'bg-muted/40 text-muted-foreground/60';
  if (b === '+30d') return 'bg-seven-danger/20 text-seven-danger font-semibold';
  if (b === '16-30d') return 'bg-seven-warning/25 text-foreground font-medium';
  if (b === '8-15d') return 'bg-seven-warning/10 text-foreground';
  return 'bg-seven-success/15 text-foreground';
}

export function MapaRiscoMatriz() {
  const data = getMatrizRisco();
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <SectionHeader
          overline="Mapa de risco"
          titulo="Fase × tempo sem interação"
          descricao="Quantos clientes em cada fase estão há quanto tempo sem reunião realizada."
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold">
                <th className="text-left py-2 pr-4">Fase</th>
                {buckets.map(b => <th key={b} className="text-center py-2 px-2">{b}</th>)}
              </tr>
            </thead>
            <tbody>
              {fases.map(f => (
                <tr key={f.key} className="border-t border-border/40">
                  <td className="py-2.5 pr-4 text-foreground font-medium">{f.label}</td>
                  {buckets.map(b => {
                    const cell = data.find(c => c.fase === f.key && c.bucketTempo === b);
                    const qtd = cell?.qtd || 0;
                    return (
                      <td key={b} className="py-1 px-1">
                        <div className={cn('h-10 rounded-md flex items-center justify-center tabular-nums text-base transition-colors', cellColor(b, qtd))}>
                          {qtd}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground">Células vermelhas = clientes com risco alto · agir imediatamente. Verde = situação saudável.</p>
      </CardContent>
    </Card>
  );
}
