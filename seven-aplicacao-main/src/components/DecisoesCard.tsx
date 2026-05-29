import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gavel, Plus } from 'lucide-react';
import { StatusTag } from '@/components/StatusTag';
import { getDecisoes, labelImpacto, variantImpacto, labelStatusDecisao, variantStatusDecisao } from '@/data/clienteBloco3';
import { toast } from '@/hooks/use-toast';

interface Props { clienteId: string; }

export function DecisoesCard({ clienteId }: Props) {
  const decisoes = getDecisoes(clienteId);
  const [showAll, setShowAll] = useState(false);
  const visiveis = showAll ? decisoes : decisoes.slice(0, 4);
  const fmt = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gavel className="h-4 w-4 text-primary" strokeWidth={1.5} />
          Decisões Registradas
          <span className="text-xs text-muted-foreground font-normal">({decisoes.length})</span>
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => toast({ title: 'Registrar decisão', description: 'Modal de nova decisão (em construção).' })}
        >
          <Plus className="h-3 w-3 mr-1" strokeWidth={1.5} /> Registrar
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {decisoes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma decisão registrada ainda.</p>
        )}
        {visiveis.map(d => (
          <div key={d.id} className="rounded-md border bg-muted/30 p-3 space-y-2 hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{d.decisao}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{d.contexto}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <StatusTag label={labelStatusDecisao[d.status]} variant={variantStatusDecisao[d.status]} />
                <StatusTag label={labelImpacto[d.impacto]} variant={variantImpacto[d.impacto]} />
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              <span>{fmt(d.data)}</span>
              <span>·</span>
              <span>{d.responsavel}</span>
              {d.origemReuniaoId && (
                <>
                  <span>·</span>
                  <span className="italic">via reunião</span>
                </>
              )}
            </div>
          </div>
        ))}
        {decisoes.length > 4 && (
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowAll(s => !s)}>
            {showAll ? 'Ver menos' : `Ver todas (${decisoes.length})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
