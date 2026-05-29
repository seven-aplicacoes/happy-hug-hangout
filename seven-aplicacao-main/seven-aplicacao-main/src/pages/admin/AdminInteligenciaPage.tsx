import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { StatusTag } from '@/components/StatusTag';
import { SectionHeader } from '@/components/SectionHeader';
import { ListRow } from '@/components/ListRow';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { labelEspecialidade, labelRegiao, labelFase, labelRisco, labelEngajamento, calcularEngajamento } from '@/data/mockData';
import { useClientes } from '@/hooks/useClientes';
import { useContratos } from '@/hooks/useContratos';
import { useIAInsights, type IAInsight } from '@/hooks/useIAInsights';
import { labelModulo, type SevenModuloId } from '@/data/sevenGestaoMock';
import { getKpisEstrategicos, getProdutoContrato, PRODUTOS } from '@/data/contratoExtras';
import { BarChart3, TrendingUp, AlertTriangle, Users, Globe, Layers, Activity, DollarSign, Shield, X, Plug, RefreshCw, RotateCw, Package, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer } from 'recharts';
import type { NivelRisco, Cliente, Contrato } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IaInsightCard } from '@/components/IaInsightCard';
import { labelTipoIA, type IaInsightTipo } from '@/data/iaInsights';

// Paleta categórica editorial SEVEN — 12 tons únicos, ordenados para máximo contraste entre vizinhos
const CATEGORICAL_PALETTE = [
  '#A18261', '#3D4F5C', '#D4B896', '#5C6B5C', '#7A6A55', '#8FA68E',
  '#4A4A4A', '#C9A88E', '#2D3A42', '#B8956A', '#6B7F8C', '#937C5A',
];

const getCategoricalColor = (index: number): string => {
  if (index < CATEGORICAL_PALETTE.length) return CATEGORICAL_PALETTE[index];
  const extra = index - CATEGORICAL_PALETTE.length;
  const hue = (extra * 47) % 360;
  return `hsl(${hue}, 22%, 48%)`;
};

const RISK_COLORS: Record<string, string> = {
  baixo: 'hsl(152, 35%, 35%)',
  medio: 'hsl(38, 80%, 50%)',
  alto: 'hsl(18, 78%, 52%)',
  critico: 'hsl(348, 65%, 28%)',
};

export default function AdminInteligenciaPage() {
  const navigate = useNavigate();
  const [filtroAtivo, setFiltroAtivo] = useState<{ tipo: string; valor: string } | null>(null);
  const [periodoKpi, setPeriodoKpi] = useState<'3m' | '6m' | '12m'>('12m');
  
  const { clientes, isLoading: loadingClientes } = useClientes();
  const { contratos, isLoading: loadingContratos } = useContratos();
  const { data: insightsIAData, isLoading: loadingInsights } = useIAInsights();

  const kpisEstrat = useMemo(() => getKpisEstrategicos(periodoKpi), [periodoKpi]);

  const porProduto = useMemo(() => {
    if (!contratos) return [];
    const acc: Record<string, number> = {};
    contratos.filter(c => !['encerrado', 'churn', 'cancelado'].includes(c.status || ''))
      .forEach(c => {
        const p = getProdutoContrato(c.id);
        acc[p] = (acc[p] || 0) + 1;
      });
    return PRODUTOS
      .map(p => ({ name: p, label: p, value: acc[p] || 0 }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [contratos]);

  const { ativos, ativosPuros, riscoChurn, upsell, indiceMedio, faturamentoFmt, ticketMedio, faturamentoTotalMensal } = useMemo(() => {
    if (!clientes || !contratos) return { 
      ativos: [], ativosPuros: [], riscoChurn: [], upsell: [], indiceMedio: 0, faturamentoFmt: 'R$ 0', ticketMedio: 0, faturamentoTotalMensal: 0
    };

    const ativos = (clientes as any[]).filter(c => c.status === 'ativo' || (c.status === 'bloqueado' || c.status === 'suspenso'));
    const ativosPuros = (clientes as any[]).filter(c => c.status === 'ativo');
    const riscoChurn = (clientes as any[]).filter(c => calcularEngajamento(c.id) === 'critico');
    const upsell = (clientes as any[]).filter(c => c.potencialUpsell);
    const indiceMedio = ativos.length > 0 ? Math.round(ativos.reduce((a, c) => a + (c.indiceSeven || 0), 0) / ativos.length) : 0;

    const faturamentoTotalMensal = ativosPuros.reduce((a, c) => a + (c.faturamentoMensal || 0), 0);
    const faturamentoFmt = `R$ ${faturamentoTotalMensal.toLocaleString('pt-BR')}`;

    const contratosAtivos = (contratos as any[]).filter(c => c.status === 'ativo' || (c.status === 'bloqueado' || c.status === 'suspenso'));
    const ticketMedio = contratosAtivos.length > 0
      ? Math.round(contratosAtivos.reduce((a, c) => a + c.valor, 0) / contratosAtivos.length)
      : 0;

    return { ativos, ativosPuros, riscoChurn, upsell, indiceMedio, faturamentoFmt, ticketMedio, faturamentoTotalMensal };
  }, [clientes, contratos]);

  const porEspecialidade = useMemo(() => {
    const acc: Record<string, number> = {};
    ativos.forEach(c => { acc[c.especialidade] = (acc[c.especialidade] || 0) + 1; });
    return Object.entries(acc).map(([name, value]) => ({ name, value, label: labelEspecialidade[name] || name })).sort((a, b) => b.value - a.value);
  }, [ativos]);

  const porRegiao = useMemo(() => {
    const acc: Record<string, number> = {};
    ativos.forEach(c => { acc[c.regiao] = (acc[c.regiao] || 0) + 1; });
    return Object.entries(acc).map(([name, value]) => ({ name, value, label: labelRegiao[name] || name })).sort((a, b) => b.value - a.value);
  }, [ativos]);

  const porFase = useMemo(() => {
    const acc: Record<string, number> = {};
    ativos.forEach(c => { acc[c.faseMetodologica] = (acc[c.faseMetodologica] || 0) + 1; });
    return Object.entries(acc).map(([name, value]) => ({ name, value, label: labelFase[name] || name })).sort((a, b) => b.value - a.value);
  }, [ativos]);

  const mrrPorEspecialidade = useMemo(() => {
    const acc: Record<string, number> = {};
    ativosPuros.forEach(c => { acc[c.especialidade] = (acc[c.especialidade] || 0) + (c.faturamentoMensal || 0); });
    return Object.entries(acc).map(([name, value]) => ({ name, value, label: labelEspecialidade[name] || name })).sort((a, b) => b.value - a.value);
  }, [ativosPuros]);

  const mrrPorRegiao = useMemo(() => {
    const acc: Record<string, number> = {};
    ativosPuros.forEach(c => { acc[c.regiao] = (acc[c.regiao] || 0) + (c.faturamentoMensal || 0); });
    return Object.entries(acc).map(([name, value]) => ({ name, value, label: labelRegiao[name] || name })).sort((a, b) => b.value - a.value);
  }, [ativosPuros]);

  const porRisco = useMemo(() => {
    const acc: Record<string, number> = {};
    ativos.forEach(c => { acc[calcularEngajamento(c.id)] = (acc[calcularEngajamento(c.id)] || 0) + 1; });
    return (['baixo', 'medio', 'alto', 'critico'] as NivelRisco[])
      .filter(r => acc[r])
      .map(r => ({ name: r, value: acc[r], label: labelRisco[r], color: RISK_COLORS[r] }));
  }, [ativos]);

  const evolucaoBase = useMemo(() => {
    const meses = ['Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr'];
    const base = ativos.length;
    return meses.map((mes, i) => {
      const seed = (i + 1) * 7;
      const ativosN = Math.max(3, base - 3 + Math.floor((seed % 5)));
      const emRisco = Math.max(0, Math.floor((seed % 3)));
      const pausados = i < 2 ? 1 : 0;
      return { mes, ativos: ativosN, em_risco: emRisco, pausados };
    });
  }, [ativos]);

  const adocaoSeven = useMemo(() => {
    const totais: Record<SevenModuloId, number> = {
      precificacao: 0, planejamento: 0, orcamentacao: 0, faturamento: 0, financeiro: 0, empresa: 0,
    };
    let integradas = 0;
    ativosPuros.forEach(c => {
      const integrated = (c.indiceSeven || 0) > 50;
      if (integrated) integradas++;
      if ((c.indiceSeven || 0) > 30) totais.empresa++;
      if ((c.indiceSeven || 0) > 40) totais.financeiro++;
      if ((c.indiceSeven || 0) > 60) totais.planejamento++;
    });
    const total = ativosPuros.length || 1;
    return {
      integradas,
      pctIntegracao: Math.round((integradas / total) * 100),
      modulos: (Object.keys(totais) as SevenModuloId[])
        .map(id => ({ id, label: labelModulo[id], qtd: totais[id], pct: Math.round((totais[id] / total) * 100) }))
        .sort((a, b) => b.qtd - a.qtd),
    };
  }, [ativosPuros]);

  const insightsIA = useMemo(() => {
    return (insightsIAData || []).map(ins => ({
      ...ins,
      id: ins.id,
      tipo: ins.tipo as IaInsightTipo,
      titulo: ins.titulo,
      descricao: ins.descricao,
      confianca: ins.confianca,
      variant: ins.variant,
      acaoLabel: ins.acaoLabel || 'Ver detalhes',
      acaoHref: ins.acaoHref
    }));
  }, [insightsIAData]);

  const listaFiltrada = useMemo(() => {
    if (!clientes || !contratos) return { churn: [], upsell: [] };
    let base = (clientes as any[]);
    if (filtroAtivo) {
      const { tipo, valor } = filtroAtivo;
      if (tipo === 'especialidade') base = base.filter(c => c.especialidade === valor);
      else if (tipo === 'regiao') base = base.filter(c => c.regiao === valor);
      else if (tipo === 'fase') base = base.filter(c => c.faseMetodologica === valor);
      else if (tipo === 'risco') base = base.filter(c => calcularEngajamento(c.id) === valor);
      else if (tipo === 'produto') base = base.filter(c => (contratos as any[]).some(ct => ct.clienteId === c.id && !['encerrado', 'churn', 'cancelado'].includes(ct.status || '') && getProdutoContrato(ct.id) === valor));
    }
    return {
      churn: base.filter(c => calcularEngajamento(c.id) === 'critico'),
      upsell: base.filter(c => c.potencialUpsell),
    };
  }, [clientes, contratos, filtroAtivo]);

  if (loadingClientes || loadingContratos || loadingInsights) {
    return <div className="p-8 text-center text-muted-foreground">Carregando inteligência...</div>;
  }

  if (loadingClientes || loadingContratos || loadingInsights) {
    return <div className="p-8 text-center text-muted-foreground">Carregando inteligência...</div>;
  }

  const handleClick = (tipo: string, entry: { name: string }) => {
    if (filtroAtivo?.tipo === tipo && filtroAtivo?.valor === entry.name) setFiltroAtivo(null);
    else setFiltroAtivo({ tipo, valor: entry.name });
  };

  /** Distribuição: pizza para ≤6 categorias, barra horizontal para >6 */
  const Distribution = ({ titulo, icon: Icon, data, tipo }: { titulo: string; icon: typeof Layers; data: { name: string; value: number; label: string }[]; tipo: string }) => {
    const usePie = data.length <= 6;
    const config = data.reduce((acc, item, i) => {
      acc[item.name] = { label: item.label, color: getCategoricalColor(i) };
      return acc;
    }, {} as Record<string, { label: string; color: string }>);
    const max = Math.max(...data.map(d => d.value), 1);

    return (
      <Card className={filtroAtivo?.tipo === tipo ? 'ring-2 ring-primary' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />{titulo}
            <span className="ml-auto text-xs font-normal text-muted-foreground">{data.length} categorias</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usePie ? (
            <div className="flex items-center gap-4">
              <ChartContainer config={config} className="h-[160px] w-[160px] aspect-square">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={30} strokeWidth={2}
                    onClick={(_, index) => handleClick(tipo, data[index])} className="cursor-pointer">
                    {data.map((entry, i) => (
                      <Cell key={entry.name} fill={getCategoricalColor(i)}
                        opacity={filtroAtivo?.tipo === tipo && filtroAtivo?.valor !== entry.name ? 0.3 : 1} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex-1 space-y-1.5">
                {data.map((entry, i) => (
                  <div key={entry.name}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 transition-colors"
                    onClick={() => handleClick(tipo, entry)}>
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: getCategoricalColor(i) }} />
                    <span className="text-muted-foreground flex-1">{entry.label}</span>
                    <span className="font-medium tabular-nums">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {data.map((entry, i) => {
                const pct = (entry.value / max) * 100;
                const dim = filtroAtivo?.tipo === tipo && filtroAtivo?.valor !== entry.name;
                return (
                  <button key={entry.name} type="button"
                    onClick={() => handleClick(tipo, entry)}
                    className="w-full text-left group transition-opacity"
                    style={{ opacity: dim ? 0.35 : 1 }}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors truncate pr-2">{entry.label}</span>
                      <span className="font-medium tabular-nums">{entry.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: getCategoricalColor(i) }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const evolucaoConfig = {
    ativos: { label: 'Ativos', color: 'hsl(152, 35%, 35%)' },
    em_risco: { label: 'Em risco', color: 'hsl(18, 78%, 52%)' },
    pausados: { label: 'Pausados', color: 'hsl(38, 80%, 50%)' },
  };

  const MrrBreakdown = ({ titulo, icon: Icon, data, total }: { titulo: string; icon: typeof Layers; data: { name: string; value: number; label: string }[]; total: number }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />{titulo}
            <span className="ml-auto text-xs font-normal text-muted-foreground">{data.length} categorias</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {data.map((entry, i) => {
              const pct = (entry.value / max) * 100;
              const share = total > 0 ? (entry.value / total) * 100 : 0;
              return (
                <div key={entry.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground truncate pr-2">{entry.label}</span>
                    <span className="font-medium tabular-nums">
                      R$ {entry.value.toLocaleString('pt-BR')}
                      <span className="text-muted-foreground ml-1.5">{share.toFixed(0)}%</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: getCategoricalColor(i) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-14">
      <PageHeader titulo="Inteligência de Mercado" subtitulo="Painel analítico da carteira" />

      <section>
        <SectionHeader overline="IA · Sinais detectados" titulo="Insights inteligentes" descricao="Recomendações geradas a partir de engajamento, capacidade e ciclo contratual" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insightsIA.length === 0 && (
            <p className="text-xs text-muted-foreground col-span-3">Sem sinais relevantes no momento.</p>
          )}
          {insightsIA.slice(0, 6).map(ins => (
            <IaInsightCard key={ins.id} insight={ins} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader overline="Visão geral" titulo="Indicadores da carteira" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard titulo="Faturamento mensal" valor={faturamentoFmt} icon={DollarSign} variant="default" subtitulo={`${ativosPuros.length} clientes ativos`} className="lg:col-span-2" />
          <StatCard titulo="Base ativa" valor={ativos.length} icon={Users} variant="default" />
          <StatCard titulo="Risco de churn" valor={riscoChurn.length} icon={AlertTriangle} variant="danger" subtitulo="15+ dias s/ reunião" />
          <StatCard titulo="Potencial upsell" valor={upsell.length} icon={TrendingUp} variant="default" subtitulo="Oportunidades" />
          <StatCard titulo="Ticket médio" valor={`R$ ${ticketMedio.toLocaleString('pt-BR')}`} icon={DollarSign} variant="default" subtitulo="Contratos ativos" />
        </div>
      </section>

      {/* KPIs Estratégicos de Contratos */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <SectionHeader overline="Saúde contratual" titulo="KPIs estratégicos" descricao="Indicadores agregados de retenção, renovação e valor" />
          <Select value={periodoKpi} onValueChange={(v: '3m' | '6m' | '12m') => setPeriodoKpi(v)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="12m">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Churn rate', value: `${kpisEstrat.churnRate.toFixed(1)}%`, delta: kpisEstrat.deltaChurn, icon: AlertTriangle, serie: kpisEstrat.serieChurn, invert: true },
            { label: 'Taxa de renovação', value: `${kpisEstrat.taxaRenovacao.toFixed(1)}%`, delta: kpisEstrat.deltaRenovacao, icon: RefreshCw, serie: kpisEstrat.serieRenovacao, invert: false },
            { label: 'Taxa de reativação', value: `${kpisEstrat.taxaReativacao.toFixed(1)}%`, delta: kpisEstrat.deltaReativacao, icon: RotateCw, serie: kpisEstrat.serieReativacao, invert: false },
            { label: 'LTV médio', value: `R$ ${kpisEstrat.ltvMedio.toLocaleString('pt-BR')}`, delta: kpisEstrat.deltaLtv, icon: DollarSign, serie: kpisEstrat.serieLtv, invert: false },
          ].map(k => {
            const positivo = k.invert ? k.delta < 0 : k.delta > 0;
            const deltaColor = k.delta === 0 ? 'text-muted-foreground' : positivo ? 'text-seven-success' : 'text-seven-danger';
            const Arrow = k.delta >= 0 ? ArrowUp : ArrowDown;
            return (
              <Card key={k.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <k.icon className="h-3.5 w-3.5" strokeWidth={1.5} />{k.label}
                    </span>
                    <span className={`text-xs flex items-center gap-0.5 tabular-nums ${deltaColor}`}>
                      <Arrow className="h-3 w-3" strokeWidth={2} />{Math.abs(k.delta).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xl font-semibold tabular-nums">{k.value}</p>
                  <ResponsiveContainer width="100%" height={32}>
                    <LineChart data={k.serie.map((v, i) => ({ i, v }))}>
                      <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Distribuições */}
      <section>
        <SectionHeader overline="Distribuição da base" titulo="Composição por dimensão" descricao="Clique em uma categoria para filtrar as listas abaixo" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Distribution titulo="Por Especialidade" icon={Layers} data={porEspecialidade} tipo="especialidade" />
          <Distribution titulo="Por Região" icon={Globe} data={porRegiao} tipo="regiao" />
          <Distribution titulo="Por Fase Metodológica" icon={BarChart3} data={porFase} tipo="fase" />
          <Distribution titulo="Por Produto" icon={Package} data={porProduto} tipo="produto" />
        </div>
      </section>

      {/* Faturamento — breakdowns */}
      <section>
        <SectionHeader overline="Faturamento mensal (MRR)" titulo="Distribuição financeira" descricao="Soma do faturamento mensal declarado por dimensão" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MrrBreakdown titulo="Por Especialidade" icon={Layers} data={mrrPorEspecialidade} total={faturamentoTotalMensal} />
          <MrrBreakdown titulo="Por Região" icon={Globe} data={mrrPorRegiao} total={faturamentoTotalMensal} />
        </div>
      </section>

      {/* Adoção do Seven Gestão */}
      <section>
        <SectionHeader
          overline="Plataforma Seven Gestão"
          titulo="Adoção da plataforma"
          descricao={`${adocaoSeven.integradas} de ${ativosPuros.length} clínicas integradas (${adocaoSeven.pctIntegracao}%)`}
        />
        <Card>
          <CardContent className="p-5">
            <div className="space-y-3">
              {adocaoSeven.modulos.map((m, i) => (
                <div key={m.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Plug className="h-3 w-3" strokeWidth={1.5} />{m.label}
                    </span>
                    <span className="font-medium tabular-nums">
                      {m.qtd} <span className="text-muted-foreground">/ {ativosPuros.length}</span>
                      <span className="text-muted-foreground ml-1.5">{m.pct}%</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${m.pct}%`, backgroundColor: getCategoricalColor(i) }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Risco + Evolução */}
      <section>
        <SectionHeader overline="Risco e movimento" titulo="Saúde contratual" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className={filtroAtivo?.tipo === 'risco' ? 'ring-2 ring-primary' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" strokeWidth={1.5} />Distribuição por risco
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex h-6 rounded-full overflow-hidden">
                {porRisco.map(r => (
                  <div key={r.name} className="h-full cursor-pointer transition-opacity hover:opacity-80"
                    style={{
                      width: `${(r.value / ativos.length) * 100}%`,
                      backgroundColor: r.color,
                      opacity: filtroAtivo?.tipo === 'risco' && filtroAtivo?.valor !== r.name ? 0.3 : 1,
                    }}
                    onClick={() => handleClick('risco', r)}
                    title={`${r.label}: ${r.value}`} />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {porRisco.map(r => (
                  <div key={r.name}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors"
                    onClick={() => handleClick('risco', r)}>
                    <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: r.color }} />
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-medium ml-auto tabular-nums">{r.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" strokeWidth={1.5} />Evolução da base ativa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={evolucaoConfig} className="h-[200px] w-full">
                <BarChart data={evolucaoBase}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="mes" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="ativos" stackId="a" fill="hsl(152, 35%, 35%)" />
                  <Bar dataKey="em_risco" stackId="a" fill="hsl(18, 78%, 52%)" />
                  <Bar dataKey="pausados" stackId="a" fill="hsl(38, 80%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Filtro ativo */}
      {filtroAtivo && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filtrando por:</span>
          <StatusTag label={
            filtroAtivo.tipo === 'especialidade' ? labelEspecialidade[filtroAtivo.valor] :
            filtroAtivo.tipo === 'regiao' ? labelRegiao[filtroAtivo.valor] :
            filtroAtivo.tipo === 'fase' ? labelFase[filtroAtivo.valor] :
            filtroAtivo.tipo === 'produto' ? filtroAtivo.valor :
            labelRisco[filtroAtivo.valor] || filtroAtivo.valor
          } />
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setFiltroAtivo(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Listas Churn e Upsell */}
      <section>
        <SectionHeader overline="Listas operacionais" titulo="Clientes em destaque" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-seven-danger/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-seven-danger" strokeWidth={1.5} />
                Risco de churn
                <span className="ml-auto text-xs font-normal text-muted-foreground">{listaFiltrada.churn.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {listaFiltrada.churn.length === 0 ? (
                <EmptyState
                  titulo="Nenhum cliente em risco"
                  descricao={filtroAtivo ? 'Tente remover o filtro ativo.' : 'A carteira está saudável neste momento.'}
                />
              ) : listaFiltrada.churn.map(c => (
                <ListRow key={c.id} tone="danger" onClick={() => navigate(`/admin/cliente/${c.id}`)}
                  trailing={<StatusTag label={calcularEngajamento(c.id) === 'critico' ? 'Crítico' : 'Alto'} variant="danger" />}>
                  <p className="text-sm font-medium truncate">{c.nomeFantasia}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.segmento} · {labelFase[c.faseMetodologica]} · {c.consultorNome}</p>
                </ListRow>
              ))}
            </CardContent>
          </Card>

          <Card className="border-seven-success/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-seven-success" strokeWidth={1.5} />
                Potencial de upsell
                <span className="ml-auto text-xs font-normal text-muted-foreground">{listaFiltrada.upsell.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {listaFiltrada.upsell.length === 0 ? (
                <EmptyState
                  titulo="Nenhuma oportunidade"
                  descricao={filtroAtivo ? 'Tente remover o filtro ativo.' : 'Nenhum cliente com potencial mapeado.'}
                />
              ) : listaFiltrada.upsell.map(c => (
                <ListRow key={c.id} tone="success" onClick={() => navigate(`/admin/cliente/${c.id}`)}
                  trailing={<StatusTag label="Upsell" variant="success" />}>
                  <p className="text-sm font-medium truncate">{c.nomeFantasia}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.segmento} · {labelFase[c.faseMetodologica]} · {c.consultorNome}</p>
                </ListRow>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
