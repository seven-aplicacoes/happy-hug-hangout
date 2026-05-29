import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatusTag } from '@/components/StatusTag';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getRelatorioMensal } from '@/data/clienteBloco3';
import { toast } from '@/hooks/use-toast';
import type { Cliente } from '@/types';

interface Props { cliente: Cliente; }

const TEND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus };
const TEND_COR = {
  up: 'text-seven-success',
  down: 'text-seven-danger',
  flat: 'text-muted-foreground',
};

export function RelatorioMensalCard({ cliente }: Props) {
  const [mesOffset, setMesOffset] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const rel = getRelatorioMensal(cliente, mesOffset);
  const fmt = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" strokeWidth={1.5} />
              Relatório Mensal — {rel.mesReferencia}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMesOffset(o => o + 1)} title="Mês anterior">
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={mesOffset === 0}
                onClick={() => setMesOffset(o => Math.max(0, o - 1))}
                title="Mês posterior"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status + meta */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <StatusTag label="Gerado automaticamente" variant="success" />
            <span className="text-muted-foreground">Por {rel.consultor} · em {fmt(rel.geradoEm)}</span>
          </div>

          {/* Resumo executivo */}
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="ui-overline mb-1">Resumo executivo</p>
            <p className="text-sm leading-snug">{rel.resumoExecutivo}</p>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {rel.highlights.map(h => {
              const Icon = TEND_ICON[h.tendencia];
              return (
                <div key={h.label} className="rounded-md border bg-muted/20 p-2.5 space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{h.label}</p>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-lg font-bold tabular-nums">{h.valor}</p>
                    <Icon className={`h-3.5 w-3.5 ${TEND_COR[h.tendencia]}`} strokeWidth={1.5} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Próximos passos preview */}
          <div>
            <p className="ui-overline mb-1.5">Próximos passos</p>
            <ul className="space-y-1">
              {rel.proximosPassos.slice(0, 2).map((p, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">→</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} /> Visualizar completo
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => toast({ title: 'Relatório enviado', description: `${rel.mesReferencia} disponível em PDF.` })}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} /> Baixar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog preview completo */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-editorial text-2xl">
              Relatório Mensal — {rel.mesReferencia}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div className="text-xs text-muted-foreground">
              {cliente.nomeFantasia} · Consultor: {rel.consultor} · Gerado em {fmt(rel.geradoEm)}
            </div>

            <div className="rounded-md border bg-muted/30 p-4">
              <p className="ui-overline mb-2">Resumo executivo</p>
              <p className="text-sm leading-relaxed">{rel.resumoExecutivo}</p>
            </div>

            {rel.secoes.map((s, i) => (
              <div key={i} className="space-y-2 border-l-2 border-primary/30 pl-4">
                <h3 className="text-sm font-bold">{s.titulo}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.resumo}</p>
                {s.destaques.length > 0 && (
                  <ul className="space-y-1 pt-1">
                    {s.destaques.map((d, j) => (
                      <li key={j} className="text-xs flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <div className="rounded-md border bg-muted/30 p-4">
              <p className="ui-overline mb-2">Próximos passos</p>
              <ul className="space-y-1.5">
                {rel.proximosPassos.map((p, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary">→</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>Fechar</Button>
              <Button onClick={() => toast({ title: 'Relatório enviado', description: 'PDF disponível para download.' })}>
                <Download className="h-4 w-4 mr-1.5" strokeWidth={1.5} /> Baixar PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
