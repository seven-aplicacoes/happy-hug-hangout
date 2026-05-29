import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusTag } from '@/components/StatusTag';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';
import { StatCard } from '@/components/StatCard';
import {
  getSevenData, labelSeveridade, variantSeveridade,
  type SevenIntegracao,
} from '@/data/sevenGestaoMock';
import {
  Settings2, AlertTriangle, ExternalLink, DollarSign, ShoppingCart,
  TrendingUp, BarChart3, Receipt, Plug, Power, PowerOff, ChevronRight,
} from 'lucide-react';

interface Props {
  clienteId: string;
  faturamentoMensalBase: number;
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const fmtPct = (v: number) => `${v > 0 ? '+' : ''}${v}%`;

export const SaudeOperacionalTab = ({ clienteId, faturamentoMensalBase }: Props) => {
  const data: SevenIntegracao = getSevenData(clienteId, faturamentoMensalBase);

  if (!data.integrada) {
    return (
      <Card>
        <CardContent className="py-12">
          <EmptyState
            titulo="Clínica sem integração com o Seven Gestão"
            descricao="Os dados operacionais do sistema das clínicas aparecem aqui assim que a integração for ativada."
          />
        </CardContent>
      </Card>
    );
  }

  const fat = data.faturamento6m;
  const atual = fat[5]?.valor || 0;
  const anterior = fat[4]?.valor || 0;
  const variacao = anterior > 0 ? Math.round(((atual - anterior) / anterior) * 100) : 0;
  const maxFat = Math.max(...fat.map(m => m.valor), 1);

  return (
    <div className="space-y-6">
      {/* Módulos e Engajamento */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
            Módulos e Engajamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {data.modulos.map(m => (
              <div
                key={m.id}
                className={`rounded-md border p-3 transition-colors ${
                  m.ativo ? 'bg-card border-border/70' : 'bg-muted/30 border-border/40 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{m.nome}</span>
                  {m.ativo ? (
                    <Power className="h-3.5 w-3.5 text-seven-success" strokeWidth={1.5} />
                  ) : (
                    <PowerOff className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {m.ativo
                    ? m.ultimoUsoDias === 0
                      ? 'Usado hoje'
                      : `Último uso há ${m.ultimoUsoDias}d`
                    : 'Sem uso registrado'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alertas Operacionais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-seven-warning" strokeWidth={1.5} />
            Alertas Operacionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.alertas.length === 0 ? (
            <EmptyState titulo="Nenhum alerta ativo" descricao="A operação da clínica está saudável." />
          ) : (
            <ul className="space-y-2">
              {data.alertas.map(a => (
                <li
                  key={a.id}
                  className={`flex items-start gap-3 p-3 rounded-md border ${
                    a.severidade === 'critico' ? 'border-seven-danger/30 bg-seven-danger/5' :
                    a.severidade === 'atencao' ? 'border-seven-warning/30 bg-seven-warning/5' :
                    'border-primary/30 bg-primary/5'
                  }`}
                >
                  <StatusTag label={labelSeveridade[a.severidade]} variant={variantSeveridade[a.severidade]} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.titulo}</p>
                    <p className="text-xs text-muted-foreground">{a.descricao}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs shrink-0">
                    Ver no sistema <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Faturamento Recente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" strokeWidth={1.5} />
            Faturamento Recente
            <span className="text-[10px] font-normal text-muted-foreground ml-auto inline-flex items-center gap-1">
              <Plug className="h-3 w-3" /> Seven Gestão · somente leitura
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard size="compact" titulo="Mês atual" valor={fmtBRL(atual)} icon={DollarSign} variant="success" />
            <StatCard size="compact" titulo="Mês anterior" valor={fmtBRL(anterior)} icon={DollarSign} />
            <StatCard size="compact" titulo="Variação" valor={fmtPct(variacao)} icon={TrendingUp} variant={variacao >= 0 ? 'success' : 'danger'} />
            <StatCard size="compact" titulo="Ticket Médio" valor={fmtBRL(data.ticketMedio)} icon={BarChart3} />
            <StatCard size="compact" titulo="Vendas no mês" valor={data.vendasMes} icon={ShoppingCart} />
          </div>

          {/* Mini gráfico de barras */}
          <div>
            <p className="ui-overline mb-2">Evolução · últimos 6 meses</p>
            <div className="flex items-end gap-2 h-28">
              {fat.map((m, i) => {
                const h = Math.max(8, (m.valor / maxFat) * 100);
                const isLast = i === fat.length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-sm transition-colors ${isLast ? 'bg-primary' : 'bg-foreground/30'}`}
                      style={{ height: `${h}%` }}
                      title={fmtBRL(m.valor)}
                    />
                    <span className="text-[10px] text-muted-foreground uppercase">{m.mesLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orçamentação */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" strokeWidth={1.5} />
            Orçamentação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard size="compact" titulo="Taxa de conversão" valor={`${data.conversaoOrcamentos}%`} icon={TrendingUp} variant={data.conversaoOrcamentos >= 40 ? 'success' : 'warning'} />
            <StatCard size="compact" titulo="Em aberto" valor={data.orcamentosAbertos} icon={ShoppingCart} />
            <StatCard size="compact" titulo="Aprovados (a faturar)" valor={fmtBRL(data.valorAprovadoAguardando)} icon={DollarSign} variant="info" />
          </div>

          <div className="space-y-2">
            <p className="ui-overline">Pipeline</p>
            {data.pipelineOrcamentos.map(p => (
              <div key={p.etapa} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/40 border border-border/50">
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-sm">{p.etapa}</span>
                </div>
                <span className="text-sm font-mono tabular-nums font-medium">{p.qtd}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
