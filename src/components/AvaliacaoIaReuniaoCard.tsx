import { Sparkles, ThumbsUp, AlertTriangle, ArrowRight, CheckSquare, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusTag } from '@/components/StatusTag';
import { Button } from '@/components/ui/button';
import { getAvaliacaoIa, labelDimensao, labelStatusAvaliacao, variantStatusAvaliacao, corNota } from '@/data/reuniaoAvaliacao';
import { toast } from '@/hooks/use-toast';

interface Props { reuniaoId: string; }

export function AvaliacaoIaReuniaoCard({ reuniaoId }: Props) {
  const av = getAvaliacaoIa(reuniaoId);
  if (!av) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-xs text-muted-foreground">
          A avaliação por IA é gerada após a realização da reunião.
        </CardContent>
      </Card>
    );
  }

  const corGeral = corNota(av.notaGeral);
  const corGeralTxt = corGeral === 'success' ? 'text-seven-success' : corGeral === 'warning' ? 'text-seven-warning' : 'text-seven-danger';
  const fmt = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };

  return (
    <Card className="border-l-4 border-l-primary bg-primary/[0.02]">
      <CardContent className="p-4 space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <span className="text-sm font-semibold">Avaliação IA da Reunião</span>
            <StatusTag label={labelStatusAvaliacao[av.status]} variant={variantStatusAvaliacao[av.status]} />
          </div>
          <div className="text-right shrink-0">
            <p className={`text-2xl font-thin tabular-nums ${corGeralTxt}`}>{av.notaGeral.toFixed(1)}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">/ 10</p>
          </div>
        </div>

        {/* Resumo executivo */}
        <div className="rounded-md bg-muted/40 p-3 border">
          <p className="ui-overline mb-1">Resumo executivo</p>
          <p className="text-sm leading-snug">{av.resumoExecutivo}</p>
        </div>

        {/* Dimensões */}
        <div>
          <p className="ui-overline mb-2">Dimensões avaliadas</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {av.dimensoes.map(d => {
              const cor = corNota(d.nota);
              const cBg = cor === 'success' ? 'bg-seven-success' : cor === 'warning' ? 'bg-seven-warning' : 'bg-seven-danger';
              const cTxt = cor === 'success' ? 'text-seven-success' : cor === 'warning' ? 'text-seven-warning' : 'text-seven-danger';
              return (
                <div key={d.dimensao} className="rounded-md border bg-background p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">{labelDimensao[d.dimensao]}</p>
                    <span className={`text-sm font-bold tabular-nums ${cTxt}`}>{d.nota.toFixed(1)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${cBg}`} style={{ width: `${(d.nota / 10) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">{d.comentario}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pontos fortes + atenção */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-md border bg-seven-success/5 border-seven-success/30 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-seven-success flex items-center gap-1.5">
              <ThumbsUp className="h-3 w-3" strokeWidth={1.5} /> Pontos fortes
            </p>
            <ul className="space-y-1">
              {av.pontosFortes.map((p, i) => (
                <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                  <span className="text-seven-success">✓</span><span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border bg-seven-warning/5 border-seven-warning/30 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-seven-warning flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" strokeWidth={1.5} /> Pontos de atenção
            </p>
            <ul className="space-y-1">
              {av.pontosAtencao.map((p, i) => (
                <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                  <span className="text-seven-warning">!</span><span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Decisões identificadas */}
        {av.decisoesIdentificadas.length > 0 && (
          <div>
            <p className="ui-overline mb-1.5 flex items-center gap-1.5">
              <CheckSquare className="h-3 w-3" strokeWidth={1.5} /> Decisões identificadas
            </p>
            <ul className="space-y-1">
              {av.decisoesIdentificadas.map((d, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5 p-2 rounded-md bg-muted/40">
                  <span className="text-primary">→</span><span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Follow-ups sugeridos */}
        {av.followUpsSugeridos.length > 0 && (
          <div>
            <p className="ui-overline mb-1.5">Follow-ups sugeridos</p>
            <div className="space-y-1.5">
              {av.followUpsSugeridos.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-md border bg-background gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{f.titulo}</p>
                    <p className="text-[10px] text-muted-foreground">{f.responsavel} · até {fmt(f.prazo)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] shrink-0"
                    onClick={() => toast({ title: 'Tarefa criada', description: f.titulo })}
                  >
                    Criar tarefa
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sugestões próxima */}
        <div className="rounded-md border-l-2 border-primary bg-primary/5 p-3">
          <p className="ui-overline mb-1.5 flex items-center gap-1.5">
            <Lightbulb className="h-3 w-3" strokeWidth={1.5} /> Sugestões para a próxima reunião
          </p>
          <ul className="space-y-1">
            {av.sugestoesProximaReuniao.map((s, i) => (
              <li key={i} className="text-xs flex items-start gap-1.5">
                <ArrowRight className="h-3 w-3 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ação revisar */}
        {av.status === 'gerada_ia' && (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast({ title: 'Avaliação marcada como revisada', description: 'O cliente será notificado em sequência.' })}
            >
              Marcar como revisada
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
