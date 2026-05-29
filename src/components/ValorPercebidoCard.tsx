import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { StatusTag } from '@/components/StatusTag';
import { getValorPercebido, corValor } from '@/data/clienteBloco3';
import type { Cliente } from '@/types';

interface Props { cliente: Cliente; }

export function ValorPercebidoCard({ cliente }: Props) {
  const vp = getValorPercebido(cliente);
  const cor = corValor(vp.score);
  const corTxt = cor === 'success' ? 'text-seven-success' : cor === 'warning' ? 'text-seven-warning' : 'text-seven-danger';
  const corBg = cor === 'success' ? 'bg-seven-success' : cor === 'warning' ? 'bg-seven-warning' : 'bg-seven-danger';
  const TendIcon = vp.tendencia === 'subindo' ? TrendingUp : vp.tendencia === 'caindo' ? TrendingDown : Minus;
  const tendCor = vp.tendencia === 'subindo' ? 'text-seven-success' : vp.tendencia === 'caindo' ? 'text-seven-danger' : 'text-muted-foreground';
  const fmt = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary" strokeWidth={1.5} />
          Valor Percebido pelo Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Score principal */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="ui-overline mb-1">Score consolidado</p>
            <div className="flex items-baseline gap-3">
              <p className={`text-4xl font-thin tabular-nums ${corTxt}`}>{vp.score}</p>
              <span className="text-sm text-muted-foreground">/100</span>
              <span className={`flex items-center gap-1 text-xs ${tendCor}`}>
                <TendIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {vp.tendencia === 'subindo' ? 'Subindo' : vp.tendencia === 'caindo' ? 'Caindo' : 'Estável'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Última avaliação: {fmt(vp.ultimaAvaliacao)} · Próxima: {fmt(vp.proximaAvaliacao)}
            </p>
          </div>
          <StatusTag
            label={cor === 'success' ? 'Saudável' : cor === 'warning' ? 'Atenção' : 'Crítico'}
            variant={cor}
          />
        </div>

        {/* Dimensões */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {vp.dimensoes.map(d => {
            const c = corValor(d.valor);
            const cBg = c === 'success' ? 'bg-seven-success' : c === 'warning' ? 'bg-seven-warning' : 'bg-seven-danger';
            return (
              <div key={d.nome} className="rounded-md border bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">{d.nome}</p>
                  <span className="text-sm font-bold tabular-nums">{d.valor}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${cBg}`} style={{ width: `${d.valor}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">{d.descricao}</p>
              </div>
            );
          })}
        </div>

        {/* Comentário do cliente */}
        {vp.comentarioCliente && (
          <div className={`rounded-md border-l-2 ${corBg.replace('bg-', 'border-')} bg-muted/30 p-3`}>
            <p className="ui-overline mb-1">Última fala do cliente</p>
            <p className="text-sm italic text-foreground/80">"{vp.comentarioCliente}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
