import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusTag } from '@/components/StatusTag';
import { getCamposContrato, getMudancasPlano, getPotencialProdutividade, labelStatusPagamento, variantStatusPagamento } from '@/data/contratoCampos';
import { contratos, clientes } from '@/data/mockData';
import { CalendarCheck, CalendarX, CreditCard, ExternalLink, History, ArrowUpRight, ArrowDownRight, Users, Gauge } from 'lucide-react';

interface Props {
  clienteId: string;
}

export function ContratoExtrasCard({ clienteId }: Props) {
  const cliente = clientes.find(c => c.id === clienteId);
  const contratoVigente = useMemo(() => contratos.find(c => c.clienteId === clienteId && !['encerrado', 'churn', 'cancelado'].includes(c.status)) || contratos.find(c => c.clienteId === clienteId), [clienteId]);
  if (!cliente || !contratoVigente) return null;
  const campos = getCamposContrato(contratoVigente.id);
  const mudancas = getMudancasPlano(clienteId);
  const potencial = getPotencialProdutividade(cliente);
  const fmt = (d?: string) => d ? d.split('-').reverse().join('/') : '—';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" strokeWidth={1.5} />
            Datas e pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="ui-overline text-muted-foreground">Data de compra</p>
              <p className="tabular-nums">{fmt(campos.dataCompra)}</p>
            </div>
            <div>
              <p className="ui-overline text-muted-foreground">Início operacional</p>
              <p className="tabular-nums">{fmt(campos.dataInicio)}</p>
            </div>
            <div>
              <p className="ui-overline text-muted-foreground">Encerramento previsto</p>
              <p className="tabular-nums">{fmt(campos.dataEncerramentoPrevista)}</p>
            </div>
            <div>
              <p className="ui-overline text-muted-foreground flex items-center gap-1">
                <CalendarX className="h-3 w-3" />Encerramento real
              </p>
              <p className="tabular-nums">{campos.dataEncerramentoReal ? fmt(campos.dataEncerramentoReal) : 'Vigente'}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" />Status do pagamento</span>
              <StatusTag label={labelStatusPagamento[campos.statusPagamento]} variant={variantStatusPagamento[campos.statusPagamento]} />
            </div>
            {campos.diasAtrasoPagamento > 0 && (
              <p className="text-xs text-seven-danger">⚠ {campos.diasAtrasoPagamento} dias em atraso</p>
            )}
            <p className="text-xs text-muted-foreground">Próximo vencimento: <span className="text-foreground tabular-nums">{fmt(campos.proximoVencimento)}</span></p>
          </div>

          <div className="pt-3 border-t border-border">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={campos.linkOneDrive} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />Pasta no OneDrive
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gauge className="h-4 w-4" strokeWidth={1.5} />
            Potencial e composição de equipe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="ui-overline text-muted-foreground">Potencial de produtividade</p>
              <span className={`text-lg font-thin tabular-nums ${
                potencial.corVariant === 'success' ? 'text-seven-success'
                : potencial.corVariant === 'warning' ? 'text-seven-warning' : 'text-seven-danger'
              }`}>{potencial.score}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded">
              <div className={`h-full rounded ${
                potencial.corVariant === 'success' ? 'bg-seven-success'
                : potencial.corVariant === 'warning' ? 'bg-seven-warning' : 'bg-seven-danger'
              }`} style={{ width: `${potencial.score}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{potencial.descricao}</p>
          </div>

          <div className="pt-3 border-t border-border">
            <p className="ui-overline text-muted-foreground mb-2 flex items-center gap-1.5"><Users className="h-3 w-3" />Equipe envolvida</p>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center justify-between">
                <span className="font-medium">{cliente.consultorNome}</span>
                <span className="text-[11px] text-muted-foreground">Consultor principal</span>
              </li>
              {campos.consultoresAdicionais.map(c => (
                <li key={c.id} className="flex items-center justify-between">
                  <span>{c.nome}</span>
                  <span className="text-[11px] text-muted-foreground">{c.papel}</span>
                </li>
              ))}
              {campos.consultoresAdicionais.length === 0 && (
                <li className="text-xs text-muted-foreground italic">Sem co-consultores no momento</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>

      {mudancas.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" strokeWidth={1.5} />
              Histórico de mudança de plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {mudancas.map((m, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                    m.tipo === 'upgrade' ? 'bg-seven-success/10 text-seven-success' : 'bg-seven-warning/10 text-seven-warning'
                  }`}>
                    {m.tipo === 'upgrade' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{m.planoAnterior} → {m.planoNovo}</p>
                    <p className="text-xs text-muted-foreground">{m.motivo}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{fmt(m.data)} · {m.responsavel}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
