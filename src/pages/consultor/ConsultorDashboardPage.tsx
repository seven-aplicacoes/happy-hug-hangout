import { useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { TaskCard } from '@/components/TaskCard';
import { Card, CardContent } from '@/components/ui/card';
import { StatusTag } from '@/components/StatusTag';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/SectionHeader';
import { ListRow } from '@/components/ListRow';
import { EmptyState } from '@/components/EmptyState';
import { PeriodFilter } from '@/components/PeriodFilter';
import { BenchmarkBadge } from '@/components/BenchmarkBadge';
import { useKPITargets } from '@/hooks/useKPITargets';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, Column } from '@/components/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import {
  labelEngajamento, calcularEngajamento, variantEngajamento,
  diasDesdeUltimaReuniao, labelStatus,
} from '@/data/mockData';
import { getAlertasContrato, labelAlertaContrato } from '@/data/contratoExtras';
import { getPeriodo, calcularMetricasConsultor, BENCHMARKS } from '@/data/clienteIndicadores';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useClientes } from '@/hooks/useClientes';
import { useContratos } from '@/hooks/useContratos';
import { useReunioes } from '@/hooks/useReunioes';
import { useTarefas } from '@/hooks/useTarefas';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyPermissions } from '@/hooks/useConsultantPermissions';
import type { Cliente, Contrato, Reuniao, Tarefa } from '@/types';
import {
  Users, CalendarDays, CheckSquare, AlertTriangle, Building2, Play,
  ArrowRight, UserCircle, Flame, Eye, Sparkles, FileClock, CalendarPlus,
  ShieldAlert, ChevronDown, ChevronUp, MessageSquareHeart, Star, Gauge, Repeat, Loader2
} from 'lucide-react';

type CarteiraFiltro = null | 'critico' | 'atencao' | 'encerrando' | 'upsell';

export default function ConsultorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { can, permissions, isLoading: loadingPermissions } = useMyPermissions();
  
  const consultorId = user?.consultorId || 'c1';
  const hoje = new Date();
  const hojeStr = hoje.toISOString().slice(0, 10);

  const { clientes, isLoading: loadingClientes } = useClientes();
  const { contratos, isLoading: loadingContratos } = useContratos();
  const { reunioes, isLoading: loadingReunioes } = useReunioes();
  const { tarefas, isLoading: loadingTarefas } = useTarefas();

  const isLoading = loadingClientes || loadingContratos || loadingReunioes || loadingTarefas || loadingPermissions;

  const [filtro, setFiltro] = useState<CarteiraFiltro>(null);
  const [alertasOpen, setAlertasOpen] = useState(false);
  const [periodo, setPeriodo] = useState(() => getPeriodo('30d'));
  const { targets, isLoading: loadingTargets } = useKPITargets();
  const [modalList, setModalList] = useState<{ isOpen: boolean; title: string; type: CarteiraFiltro }>({ 
    isOpen: false, title: '', type: null 
  });

  useEffect(() => {
    if (!loadingPermissions && !can('dashboard') && Array.isArray(permissions)) {
      const firstAllowed = permissions.find(p => p.can_view);
      if (firstAllowed) {
        const modulePaths: Record<string, string> = {
          dashboard: '/consultor/dashboard',
          clientes: '/consultor/clientes',
          reunioes: '/consultor/reunioes',
          tarefas: '/consultor/tarefas',
          documentos: '/consultor/documentos',
          metodologia: '/consultor/metodologia',
          perfil: '/consultor/meu-perfil'
        };
        const path = modulePaths[firstAllowed.module_key];
        if (path) navigate(path);
      }
    }
  }, [loadingPermissions, can, permissions, navigate]);

  const stats = useMemo(() => {
    if (!clientes || !contratos || !reunioes || !tarefas) return null;

    const meusClientes = clientes;
    const reunioesHoje = reunioes.filter(r => r.meetingDate === hojeStr);
    const minhasTarefas = tarefas;
    
    const tarefasPrioritarias = minhasTarefas
      .filter(t => t.status !== 'concluida')
      .sort((a, b) => {
        const p = { critico: 0, alto: 1, medio: 2, baixo: 3 };
        return (p[a.prioridade] ?? 4) - (p[b.prioridade] ?? 4);
      })
      .slice(0, 3);

    const enriquecidos = meusClientes.map(c => ({
      ...c,
      engajamento: calcularEngajamento(c.id),
      diasSemReuniao: diasDesdeUltimaReuniao(c.id),
    }));

    const criticos = enriquecidos.filter(c => c.engajamento === 'critico');
    const atencao = enriquecidos.filter(c => c.engajamento === 'atencao');
    const emDia = enriquecidos.filter(c => c.engajamento === 'em_dia');

    const contratosEncerrando = contratos.filter(c => {
      const d = (new Date(c.dataFim).getTime() - hoje.getTime()) / 86400000;
      return d > 0 && d <= 90 && c.status !== 'encerrado' && c.status !== 'cancelado';
    });

    const upsell = enriquecidos.filter(c => c.potencialUpsell);
    
    // Alertas de contrato (assuming getAlertasContrato handles internal state or needs data)
    // For now we'll keep the existing hook/data call but pass consultorId
    const alertasContrato = getAlertasContrato({ consultorId });

    const proximasReunioes = reunioes
      .filter(r => r.meetingDate >= hojeStr && r.status === 'agendada')
      .sort((a, b) => a.data.localeCompare(b.data) || a.startTime.localeCompare(b.startTime))
      .slice(0, 5);

    // Métricas do consultor
    // This function might need update to use real data instead of mockData inside it
    // For now we assume it takes the data or we might need to refactor it
    const metricas = calcularMetricasConsultor(consultorId, periodo, reunioes, clientes);

    return {
      meusClientes, reunioesHoje, minhasTarefas, tarefasPrioritarias, criticos,
      atencao, emDia, contratosEncerrando, upsell, alertasContrato, proximasReunioes,
      metricas
    };
  }, [clientes, contratos, reunioes, tarefas, periodo, consultorId, hojeStr]);


  if (isLoading) {
    return (
      <div className="space-y-8 p-8">
        <Skeleton className="h-12 w-[300px]" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Skeleton className="h-24" /><Skeleton className="h-24" />
          <Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!can('dashboard')) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-medium">Redirecionando para o seu primeiro módulo disponível...</p>
      </div>
    );
  }

  if (!stats) return null;

  const {
    meusClientes, reunioesHoje, minhasTarefas, tarefasPrioritarias, criticos,
    atencao, emDia, contratosEncerrando, upsell, alertasContrato, proximasReunioes,
    metricas
  } = stats;

  const targetMap = useMemo(() => {
    const map: Record<string, any> = {};
    if (targets) {
      targets.forEach(t => {
        map[t.kpi_key] = { esperado: t.target_value, tolerancia: 0, unidade: t.target_unit || '', descricao: t.description || '' };
      });
    }
    return map;
  }, [targets]);

  const getBench = (key: string, defaultBench: any) => {
    return targetMap[key] || defaultBench;
  };

  const aplicarFiltro = (f: CarteiraFiltro) => {
    if (!f) return;
    const titles = {
      critico: 'Clínicas em Crítico',
      atencao: 'Clínicas em Atenção',
      encerrando: 'Encerrando em 90d',
      upsell: 'Potencial Upsell'
    };
    setModalList({ isOpen: true, title: titles[f], type: f });
  };

  const fmtData = (d: string) => d.split('-').reverse().join('/');

  return (
    <div className="space-y-14">
      <PageHeader titulo="Meu Painel" subtitulo="Resumo do dia e ações prioritárias" />

      {/* Indicadores do período */}
      {can('indicadores') && (
        <section className="space-y-4">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <SectionHeader
            overline="Período"
            titulo="Indicadores Operacionais"
            descricao="Reuniões, CSAT, NPS e ritmo da carteira no período selecionado"
          />
          <PeriodFilter value={periodo} onChange={setPeriodo} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" strokeWidth={1.5} />
                <span className="ui-overline">Reuniões realizadas</span>
              </div>
              <p className="text-3xl font-thin tabular-nums">{metricas.reunioesRealizadas}</p>
              <BenchmarkBadge valor={metricas.reunioesRealizadas} bench={getBench('reunioes_realizadas', BENCHMARKS.reunioesRealizadas)} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquareHeart className="h-4 w-4" strokeWidth={1.5} />
                <span className="ui-overline">CSAT respostas</span>
              </div>
              <p className="text-3xl font-thin tabular-nums">{metricas.csatRespostas}</p>
              <p className="text-[11px] text-muted-foreground">de {metricas.reunioesRealizadas} reuniões</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Gauge className="h-4 w-4" strokeWidth={1.5} />
                <span className="ui-overline">Adesão CSAT</span>
              </div>
              <p className="text-3xl font-thin tabular-nums">{metricas.csatTaxaAdesao}<span className="text-base text-muted-foreground">%</span></p>
              <BenchmarkBadge valor={metricas.csatTaxaAdesao} bench={getBench('csat_adesao', BENCHMARKS.csatTaxaAdesao)} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="h-4 w-4" strokeWidth={1.5} />
                <span className="ui-overline">Nota CSAT</span>
              </div>
              <p className="text-3xl font-thin tabular-nums">{metricas.csatNotaMedia.toFixed(1)}<span className="text-base text-muted-foreground">/5</span></p>
              <BenchmarkBadge valor={metricas.csatNotaMedia} bench={getBench('csat_nota', BENCHMARKS.csatNotaMedia)} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                <span className="ui-overline">NPS</span>
              </div>
              <p className="text-3xl font-thin tabular-nums">{metricas.npsAtual}</p>
              <BenchmarkBadge valor={metricas.npsAtual} bench={getBench('nps', BENCHMARKS.npsAtual)} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Repeat className="h-4 w-4" strokeWidth={1.5} />
                <span className="ui-overline">Encontros / cliente</span>
              </div>
              <p className="text-3xl font-thin tabular-nums">{metricas.encontrosPorClienteAtivo.toFixed(1)}</p>
              <BenchmarkBadge valor={metricas.encontrosPorClienteAtivo} bench={getBench('encontros_por_cliente', BENCHMARKS.encontrosPorClienteAtivo)} />
            </CardContent>
          </Card>
        </div>
      </section>
      )}

      {/* KPIs principais */}
      <section className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            titulo="Clínicas em Crítico"
            valor={criticos.length}
            icon={Flame}
            variant={criticos.length > 0 ? 'danger' : 'success'}
            subtitulo="Sem reunião >15 dias"
            onClick={() => aplicarFiltro('critico')}
          />
          <StatCard
            titulo="Clínicas em Atenção"
            valor={atencao.length}
            icon={AlertTriangle}
            variant={atencao.length > 0 ? 'warning' : 'success'}
            subtitulo="9–15 dias sem reunião"
            onClick={() => aplicarFiltro('atencao')}
          />
          <StatCard
            titulo="Encerrando em 90d"
            valor={contratosEncerrando.length}
            icon={FileClock}
            variant={contratosEncerrando.length > 0 ? 'warning' : 'default'}
            subtitulo="Contratos próximos do fim"
            onClick={() => aplicarFiltro('encerrando')}
          />
          <StatCard
            titulo="Potencial Upsell"
            valor={upsell.length}
            icon={Sparkles}
            variant={upsell.length > 0 ? 'success' : 'default'}
            subtitulo="Oportunidades identificadas"
            onClick={() => aplicarFiltro('upsell')}
          />
        </div>

        {/* KPIs operacionais (existentes) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard titulo="Tarefas ativas" valor={minhasTarefas.filter(t => t.status !== 'concluida').length} icon={CheckSquare} size="compact" onClick={() => navigate('/consultor/tarefas')} />
          <StatCard titulo="Meus clientes" valor={meusClientes.length} icon={Users} size="compact" onClick={() => navigate('/consultor/clientes')} />
          <StatCard titulo="Meu perfil" valor="→" icon={UserCircle} size="compact" subtitulo="Indicadores e carteira" onClick={() => navigate('/consultor/meu-perfil')} />
        </div>
      </section>

      {/* Alertas de Contrato */}
      <section>
        <SectionHeader
          overline="Contratos"
          titulo="Alertas de Contrato"
          descricao="Encerramento próximo, sem renovação ou atraso em entregável"
        />
        <Card className={alertasContrato.length > 0 ? 'border-seven-warning/30' : ''}>
          <CardContent className="p-4">
            <button
              type="button"
              onClick={() => setAlertasOpen(o => !o)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className={`h-5 w-5 ${alertasContrato.length > 0 ? 'text-seven-warning' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                <div className="text-left">
                  <p className="text-sm font-medium">{alertasContrato.length} alertas ativos</p>
                  <p className="text-xs text-muted-foreground">
                    {alertasContrato.length === 0 ? 'Nenhum alerta de contrato' : 'Clique para ver detalhes'}
                  </p>
                </div>
              </div>
              {alertasContrato.length > 0 && (
                alertasOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {alertasOpen && alertasContrato.length > 0 && (
              <ul className="mt-3 pt-3 border-t border-border space-y-1.5">
                {alertasContrato.map((a, i) => (
                  <li key={`${a.contratoId}-${a.tipo}-${i}`}>
                    <button
                      onClick={() => navigate(`/consultor/cliente/${a.clienteId}`)}
                      className="w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded hover:bg-muted/50 text-left transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{a.clienteNome}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{a.mensagem}</p>
                      </div>
                      <StatusTag
                        label={labelAlertaContrato[a.tipo]}
                        variant={a.severidade === 'alta' ? 'danger' : 'warning'}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <SectionHeader
          overline="Carteira"
          titulo="Saúde da Carteira"
          descricao="Distribuição por engajamento (dias sem reunião)"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Crítico */}
          <Card className="border-seven-danger/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-seven-danger" />
                  <span className="text-sm font-medium text-foreground">Crítico</span>
                </div>
                <span className="text-2xl font-thin tabular-nums text-seven-danger">{criticos.length}</span>
              </div>
              {criticos.length === 0 ? (
                <EmptyState titulo="Nenhum cliente crítico 🎉" descricao="Carteira em dia." />
              ) : (
                <ul className="space-y-1.5">
                  {criticos.slice(0, 5).map(c => (
                    <li key={c.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/50 transition-colors">
                      <button
                        onClick={() => navigate(`/consultor/cliente/${c.id}`)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="text-sm font-medium truncate">{c.nomeFantasia}</p>
                        <p className="text-[11px] text-muted-foreground">{c.diasSemReuniao}d sem reunião</p>
                      </button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate(`/consultor/cliente/${c.id}`)}>
                        <CalendarPlus className="h-3 w-3 mr-1" /> Agendar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Atenção */}
          <Card className="border-seven-warning/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-seven-warning" />
                  <span className="text-sm font-medium text-foreground">Atenção</span>
                </div>
                <span className="text-2xl font-thin tabular-nums text-seven-warning">{atencao.length}</span>
              </div>
              {atencao.length === 0 ? (
                <EmptyState titulo="Sem alertas amarelos" descricao="Tudo no ritmo certo." />
              ) : (
                <ul className="space-y-1.5">
                  {atencao.slice(0, 5).map(c => (
                    <li key={c.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/50 transition-colors">
                      <button
                        onClick={() => navigate(`/consultor/cliente/${c.id}`)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="text-sm font-medium truncate">{c.nomeFantasia}</p>
                        <p className="text-[11px] text-muted-foreground">{c.diasSemReuniao}d sem reunião</p>
                      </button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate(`/consultor/cliente/${c.id}`)}>
                        <CalendarPlus className="h-3 w-3 mr-1" /> Agendar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Em dia — só contador */}
          <Card className="border-seven-success/30">
            <CardContent className="p-4 space-y-3 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-seven-success" />
                  <span className="text-sm font-medium text-foreground">Em dia</span>
                </div>
                <span className="text-2xl font-thin tabular-nums text-seven-success">{emDia.length}</span>
              </div>
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Clínicas com reunião nos últimos 8 dias</p>
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => navigate('/consultor/clientes')}>
                    Ver carteira <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Próximas Reuniões */}
      <section>
        <SectionHeader
          overline="Agenda"
          titulo="Próximas Reuniões"
          descricao="Próximos 5 agendamentos"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/consultor/reunioes')} className="text-xs">
              Ver agenda completa <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          }
        />
        <Card>
          <CardContent className="p-2">
            {proximasReunioes.length === 0 ? (
              <EmptyState titulo="Nenhuma reunião futura agendada" descricao="Use 'Agendar' nos cards acima para preencher sua agenda." />
            ) : proximasReunioes.map(r => {
              const eng = calcularEngajamento(r.clienteId);
              const alerta = eng !== 'em_dia';
              return (
                <ListRow
                  key={r.id}
                  onClick={() => navigate(`/consultor/cliente/${r.clienteId}`)}
                  trailing={
                    <div className="flex items-center gap-2">
                      {alerta && <StatusTag label={labelEngajamento[eng]} variant={variantEngajamento[eng]} />}
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/consultor/cliente/${r.clienteId}`); }}>
                        <Eye className="h-3 w-3 mr-1" /> Ver
                      </Button>
                    </div>
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-mono tabular-nums text-primary">
                      {fmtData(r.meetingDate)} · {r.startTime}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.clienteNome}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.tipo} · {labelStatus[r.status]}</p>
                    </div>
                  </div>
                </ListRow>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reuniões de Hoje */}
        <section>
          <SectionHeader
            overline="Hoje"
            titulo="Reuniões"
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/consultor/reunioes')} className="text-xs">
                Ver todas <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            }
          />
          <Card>
            <CardContent className="p-2">
              {reunioesHoje.length === 0 ? (
                <EmptyState titulo="Sem reuniões hoje" descricao="Aproveite para avançar tarefas pendentes." />
              ) : reunioesHoje.map(r => (
                <ListRow
                  key={r.id}
                  onClick={() => navigate(`/consultor/cliente/${r.clienteId}`)}
                  trailing={
                    <Button size="sm" className="bg-seven-success hover:bg-seven-success/90 text-white" onClick={(e) => { e.stopPropagation(); navigate(`/consultor/cliente/${r.clienteId}`); }}>
                      <Play className="h-3 w-3 mr-1" /> Iniciar
                    </Button>
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base font-mono font-semibold text-primary tabular-nums">{r.startTime}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.clienteNome}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.title}</p>
                    </div>
                  </div>
                </ListRow>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Tarefas Prioritárias */}
        <section>
          <SectionHeader
            overline="Prioridade"
            titulo="Tarefas críticas"
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/consultor/tarefas')} className="text-xs">
                Ver todas <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            }
          />
          <Card>
            <CardContent className="p-3 space-y-2">
              {tarefasPrioritarias.length === 0 ? (
                <EmptyState titulo="Nenhuma tarefa prioritária" descricao="Você está em dia com as urgências." />
              ) : tarefasPrioritarias.map(t => (
                <TaskCard key={t.id} tarefa={t} onClick={() => navigate(`/consultor/cliente/${t.clienteId}`)} />
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
