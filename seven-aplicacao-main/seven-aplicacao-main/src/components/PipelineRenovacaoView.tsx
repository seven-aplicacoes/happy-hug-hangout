import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { StatusTag } from '@/components/StatusTag';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { consultores } from '@/data/mockData';
import {
  getPipelineRenovacao, getResumoPipeline, labelEstagioRenovacao,
  descricaoEstagio, corEstagio, type EstagioRenovacao,
} from '@/data/pipelineRenovacao';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronRight, RefreshCw, TrendingDown, Sparkles, DollarSign, Target } from 'lucide-react';

const ESTAGIOS: EstagioRenovacao[] = ['elegiveis', 'em_negociacao', 'risco_saida'];

interface Props {
  scope: 'admin' | 'consultor';
}

export function PipelineRenovacaoView({ scope }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [consultorFiltro, setConsultorFiltro] = useState<string>(
    scope === 'consultor' ? (user?.consultorId || 'c1') : 'todos',
  );

  const itens = useMemo(() => getPipelineRenovacao(
    scope === 'consultor'
      ? { consultorId: user?.consultorId || 'c1' }
      : (consultorFiltro === 'todos' ? undefined : { consultorId: consultorFiltro }),
  ), [consultorFiltro, scope, user]);

  const resumo = useMemo(() => getResumoPipeline(itens), [itens]);
  const rotaCliente = (id: string) => `/${scope}/cliente/${id}`;

  return (
    <div>
      <PageHeader
        titulo="Pipeline de Renovação"
        subtitulo="Acompanhe contratos a vencer divididos em Elegíveis, Em negociação e Em risco de saída"
      >
        {scope === 'admin' && (
          <Select value={consultorFiltro} onValueChange={setConsultorFiltro}>
            <SelectTrigger className="w-[200px] h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos consultores</SelectItem>
              {consultores.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard titulo="Contratos no pipeline" valor={resumo.totalContratos} icon={RefreshCw} />
        <StatCard titulo="Valor total" valor={`R$ ${(resumo.valorTotal / 1000).toFixed(0)}k`} icon={DollarSign} />
        <StatCard titulo="Valor em risco" valor={`R$ ${(resumo.valorEmRisco / 1000).toFixed(0)}k`} icon={TrendingDown} variant={resumo.valorEmRisco > 0 ? 'danger' : 'default'} />
        <StatCard titulo="Taxa projetada" valor={`${resumo.taxaProjetada}%`} icon={Target} variant={resumo.taxaProjetada >= 70 ? 'success' : resumo.taxaProjetada >= 50 ? 'warning' : 'danger'} subtitulo="Probabilidade média de renovação" />
      </div>

      <SectionHeader titulo="Estágios" descricao="Movimentação dos contratos pelos três estágios de renovação" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ESTAGIOS.map(estagio => {
          const lista = itens.filter(i => i.estagio === estagio);
          const valor = lista.reduce((s, i) => s + i.valor, 0);
          return (
            <Card key={estagio} className={`border ${
              estagio === 'risco_saida' ? 'border-seven-danger/30'
              : estagio === 'em_negociacao' ? 'border-seven-warning/30'
              : 'border-seven-success/30'
            }`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <StatusTag label={labelEstagioRenovacao[estagio]} variant={corEstagio[estagio]} />
                  <span className="text-xl font-thin tabular-nums">{lista.length}</span>
                </div>
                <CardTitle className="text-sm font-medium pt-1">R$ {(valor / 1000).toFixed(0)}k em jogo</CardTitle>
                <p className="text-[11px] text-muted-foreground">{descricaoEstagio[estagio]}</p>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {lista.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">Nenhum contrato neste estágio</p>
                )}
                {lista.slice(0, 8).map(item => (
                  <button
                    key={item.contratoId}
                    onClick={() => navigate(rotaCliente(item.clienteId))}
                    className="w-full text-left bg-secondary/30 hover:bg-secondary border border-border/50 rounded-md p-3 transition-all hover:-translate-y-0.5 hover:shadow-md group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-medium text-foreground truncate flex-1">{item.clienteNome}</p>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" strokeWidth={1.5} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                      <span>R$ {(item.valor / 1000).toFixed(0)}k · {item.diasParaFim}d</span>
                      <span className="tabular-nums">{item.prob}%</span>
                    </div>
                    <p className="text-[11px] text-foreground/80 leading-snug mb-1">→ {item.proximaAcao}</p>
                    <p className="text-[10px] text-muted-foreground italic">{item.motivo}</p>
                  </button>
                ))}
                {lista.length > 8 && (
                  <p className="text-[10px] text-center text-muted-foreground pt-1">+ {lista.length - 8} outros</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" strokeWidth={1.5} />
              Recomendações automáticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resumo.qtdRisco > 0 && (
              <p className="text-xs text-foreground">
                <span className="font-medium">Risco crítico:</span> {resumo.qtdRisco} contratos somando R$ {(resumo.valorEmRisco / 1000).toFixed(0)}k.
                Priorize sessões de retenção esta semana.
              </p>
            )}
            {resumo.qtdNegociacao > 0 && (
              <p className="text-xs text-foreground">
                <span className="font-medium">Em negociação:</span> {resumo.qtdNegociacao} clientes aguardando follow-up — agende fechamento nos próximos 14 dias.
              </p>
            )}
            {resumo.qtdElegiveis > 0 && (
              <p className="text-xs text-foreground">
                <span className="font-medium">Elegíveis:</span> {resumo.qtdElegiveis} contratos saudáveis — envie propostas com base nos resultados consolidados.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
