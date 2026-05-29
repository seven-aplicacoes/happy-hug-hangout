import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Star, CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { StatusTag } from '@/components/StatusTag';
import { getPlanoSucesso, labelStatusMarco, variantStatusMarco } from '@/data/clienteBloco3';
import { labelFase } from '@/data/mockData';
import type { Cliente, FaseMetodologica } from '@/types';

interface Props { cliente: Cliente; }

const ICONE_STATUS = {
  concluido: CheckCircle2,
  em_andamento: Clock,
  atrasado: AlertCircle,
  pendente: Circle,
} as const;

export function PlanoSucessoCard({ cliente }: Props) {
  const plano = getPlanoSucesso(cliente);
  const fmt = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };

  // Agrupar marcos por fase
  const fases: FaseMetodologica[] = ['diagnostico', 'planejamento', 'estruturacao', 'monitoramento', 'encerramento'];
  const marcosPorFase = fases
    .map(f => ({ fase: f, marcos: plano.marcos.filter(m => m.fase === f) }))
    .filter(g => g.marcos.length > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" strokeWidth={1.5} />
          Plano de Sucesso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Visão geral + North star */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="ui-overline mb-1">Visão de longo prazo</p>
            <p className="text-sm font-editorial leading-snug">{plano.visaoGeral}</p>
          </div>
          <div className="rounded-md border-l-2 border-primary bg-primary/5 p-3">
            <p className="ui-overline mb-1 flex items-center gap-1.5">
              <Star className="h-3 w-3" strokeWidth={1.5} /> North star
            </p>
            <p className="text-sm font-medium leading-snug">{plano.northStar}</p>
          </div>
        </div>

        {/* Progresso global */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="ui-overline">Progresso global do plano</span>
            <span className="font-bold tabular-nums">{plano.progressoGlobal}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${plano.progressoGlobal}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Última revisão: {fmt(plano.ultimaRevisao)} · Próxima: {fmt(plano.proximaRevisao)}
          </p>
        </div>

        {/* Objetivos estratégicos */}
        <div>
          <p className="ui-overline mb-2">Objetivos estratégicos</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {plano.objetivos.map(o => (
              <div key={o.id} className="rounded-md border bg-muted/30 p-3 space-y-2">
                <div>
                  <p className="text-xs font-medium leading-snug">{o.titulo}</p>
                  <p className="text-[10px] text-muted-foreground">{o.metrica}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold tabular-nums">{o.valorAtual}</span>
                  <span className="text-[10px] text-muted-foreground">→ meta {o.metaAlvo}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${o.progresso}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{o.progresso}%</span>
                  <span>até {fmt(o.prazo)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marcos por fase */}
        <div>
          <p className="ui-overline mb-2">Marcos do plano</p>
          <div className="space-y-3">
            {marcosPorFase.map(g => (
              <div key={g.fase} className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {labelFase[g.fase]}
                </p>
                <div className="space-y-1.5">
                  {g.marcos.map(m => {
                    const Icon = ICONE_STATUS[m.status];
                    const corIcon = m.status === 'concluido' ? 'text-seven-success'
                      : m.status === 'em_andamento' ? 'text-seven-warning'
                      : m.status === 'atrasado' ? 'text-seven-danger'
                      : 'text-muted-foreground';
                    return (
                      <div key={m.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border bg-muted/20 p-2.5">
                        <Icon className={`h-4 w-4 shrink-0 ${corIcon}`} strokeWidth={1.5} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug truncate">{m.titulo}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <span>{m.responsavel}</span>
                            <span>·</span>
                            <span>{fmt(m.prazo)}</span>
                            {m.status === 'em_andamento' && (
                              <>
                                <span>·</span>
                                <span className="font-medium">{m.progresso}%</span>
                              </>
                            )}
                          </div>
                        </div>
                        <StatusTag label={labelStatusMarco[m.status]} variant={variantStatusMarco[m.status]} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
