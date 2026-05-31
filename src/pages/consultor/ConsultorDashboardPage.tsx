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
import { useConsultantGoals } from '@/hooks/useConsultantGoals';
import { useSurveys } from '@/hooks/useSurveys';
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
import { getPeriodo, calcularMetricasConsultor, BENCHMARKS, avaliarBenchmark } from '@/data/clienteIndicadores';
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
  const { csatSurveys, npsSurveys, isLoading: loadingSurveys } = useSurveys(consultorId);
  const { mergedGoals: targets, isLoading: loadingTargets } = useConsultantGoals(consultorId);

  const isLoading = loadingClientes || loadingContratos || loadingReunioes || loadingTarefas || loadingPermissions || loadingSurveys || loadingTargets;

  useEffect(() => {
    if (isLoading) {
      console.log('ConsultorDashboardPage: isLoading flags:', {
        loadingClientes,
        loadingContratos,
        loadingReunioes,
        loadingTarefas,
        loadingPermissions,
        loadingSurveys,
        loadingTargets
      });
    }
  }, [isLoading, loadingClientes, loadingContratos, loadingReunioes, loadingTarefas, loadingPermissions, loadingSurveys, loadingTargets]);

  const [filtro, setFiltro] = useState<CarteiraFiltro>(null);
  const [alertasOpen, setAlertasOpen] = useState(false);
  const [periodo, setPeriodo] = useState(() => getPeriodo('mes_atual'));
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
        if (path && path !== '/consultor/dashboard') navigate(path);
      }
    }
  }, [loadingPermissions, can, permissions, navigate]);

  const stats = useMemo(() => {
    // Robust checks
    const safeClientes = clientes || [];
    const safeContratos = contratos || [];
    const safeReunioes = reunioes || [];
    const safeTarefas = tarefas || [];
    const safeCsat = csatSurveys || [];
    const safeNps = npsSurveys || [];

    const meusClientes = safeClientes;
    const reunioesHoje = safeReunioes.filter(r => (r.meetingDate || '') === hojeStr);
    const minhasTarefas = safeTarefas;
    
    const tarefasPrioritarias = minhasTarefas
      .filter(t => t.status !== 'concluida')
      .sort((a, b) => {
        const p: any = { critico: 0, alto: 1, medio: 2, baixo: 3 };
        const valA = p[a.prioridade] ?? 4;
        const valB = p[b.prioridade] ?? 4;
        return valA - valB;
      })
      .slice(0, 3);

    const enriquecidos = meusClientes.map(c => ({
      ...c,
      engajamento: calcularEngajamento(c.id, safeReunioes),
      diasSemReuniao: diasDesdeUltimaReuniao(c.id, safeReunioes),
    }));

    const criticos = enriquecidos.filter(c => c.engajamento === 'critico');
    const atencao = enriquecidos.filter(c => c.engajamento === 'atencao');
    const emDia = enriquecidos.filter(c => c.engajamento === 'em_dia');

    const contratosEncerrando = safeContratos.filter(c => {
      if (!c.dataFim) return false;
      const d = (new Date(c.dataFim).getTime() - hoje.getTime()) / 86400000;
      return d > 0 && d <= 90 && c.status !== 'encerrado' && c.status !== 'cancelado';
    });

    const upsell = enriquecidos.filter(c => c.potencialUpsell);
    
    const alertasContrato = getAlertasContrato({ consultorId });

    const proximasReunioes = safeReunioes
      .filter(r => {
        const mDate = r.meetingDate || '';
        const sTime = r.startTime || '';
        const isFuture = mDate > hojeStr;
        const isTodayPending = mDate === hojeStr && sTime >= new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
        return (isFuture || isTodayPending) && r.status === 'agendada';
      })
      .sort((a, b) => (a.meetingDate || '').localeCompare(b.meetingDate || '') || (a.startTime || '').localeCompare(b.startTime || ''))
      .slice(0, 5);

    const metricas = calcularMetricasConsultor(consultorId, periodo, safeReunioes, safeClientes, safeCsat, safeNps);

    return {
      meusClientes, reunioesHoje, minhasTarefas, tarefasPrioritarias, criticos,
      atencao, emDia, contratosEncerrando, upsell, alertasContrato, proximasReunioes,
      metricas
    };
  }, [clientes, contratos, reunioes, tarefas, csatSurveys, npsSurveys, periodo, consultorId, hojeStr]);

  const targetMap = useMemo(() => {
    const map: Record<string, any> = {};
    if (targets && periodo) {
      // Calcular número de meses no período
      const numMonths = (periodo.to.getFullYear() - periodo.from.getFullYear()) * 12 + (periodo.to.getMonth() - periodo.from.getMonth()) + 1;
      const isMultipleMonths = numMonths > 1;

      targets.forEach(t => {
        let expected = t.goal_value;
        
        // Multiplicar indicadores de quantidade absoluta pela quantidade de meses
        const isAbsoluteQuantity = ['meetings_completed', 'csat_responses'].includes(t.indicator_key);
        
        if (isAbsoluteQuantity) {
          expected = t.goal_value * numMonths;
        } else {
          // Indicadores percentuais, médias ou por cliente não multiplicam
          expected = t.goal_value;
        }

        // Formatação conforme regra
        if (['meetings_completed', 'csat_responses', 'nps'].includes(t.indicator_key)) {
          expected = Math.round(expected);
        } else {
          expected = Number(expected.toFixed(1));
        }

        map[t.indicator_key] = { 
          esperado: expected, 
          tolerancia: 0, 
          unidade: t.indicator_key === 'csat_adherence' ? '%' : '', 
          descricao: isMultipleMonths && isAbsoluteQuantity 
            ? `Meta para ${numMonths} meses (${t.goal_value} × ${numMonths})` 
            : t.indicator_label,
          goal_type: t.goal_type,
          comparison_operator: t.comparison_operator,
          is_proportional: isMultipleMonths && isAbsoluteQuantity
        };
      });
    }
    return map;
  }, [targets, periodo]);

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
          {targetMap['meetings_completed'] && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" strokeWidth={1.5} />
                  <span className="ui-overline">Reuniões realizadas</span>
                </div>
                <p className="text-3xl font-thin tabular-nums">{Math.round(metricas.reunioesRealizadas)}</p>
                <BenchmarkBadge valor={metricas.reunioesRealizadas} bench={getBench('meetings_completed', BENCHMARKS.meetings_completed)} />
              </CardContent>
            </Card>
          )}
          {targetMap['csat_responses'] && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquareHeart className="h-4 w-4" strokeWidth={1.5} />
                  <span className="ui-overline">CSAT respostas</span>
                </div>
                <p className="text-3xl font-thin tabular-nums">{Math.round(metricas.csatRespostas)}</p>
                <p className="text-[11px] text-muted-foreground">de {metricas.reunioesRealizadas} reuniões</p>
              </CardContent>
            </Card>
          )}
          {targetMap['csat_adherence'] && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Gauge className="h-4 w-4" strokeWidth={1.5} />
                  <span className="ui-overline">Adesão CSAT</span>
                </div>
                <p className="text-3xl font-thin tabular-nums">{metricas.csatTaxaAdesao.toFixed(1)}<span className="text-base text-muted-foreground">%</span></p>
                <BenchmarkBadge valor={metricas.csatTaxaAdesao} bench={getBench('csat_adherence', BENCHMARKS.csat_adherence)} />
              </CardContent>
            </Card>
          )}
          {targetMap['csat_score'] && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="h-4 w-4" strokeWidth={1.5} />
                  <span className="ui-overline">Nota CSAT</span>
                </div>
                <p className="text-3xl font-thin tabular-nums">{metricas.csatNotaMedia.toFixed(1)}<span className="text-base text-muted-foreground">/5</span></p>
                <BenchmarkBadge valor={metricas.csatNotaMedia} bench={getBench('csat_score', BENCHMARKS.csat_score)} />
              </CardContent>
            </Card>
          )}
          {targetMap['nps'] && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                  <span className="ui-overline">NPS</span>
                </div>
                <p className="text-3xl font-thin tabular-nums">{Math.round(metricas.npsAtual)}</p>
                <BenchmarkBadge valor={metricas.npsAtual} bench={getBench('nps', BENCHMARKS.nps)} />
              </CardContent>
            </Card>
          )}
          {targetMap['meetings_per_client'] && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Repeat className="h-4 w-4" strokeWidth={1.5} />
                  <span className="ui-overline">Encontros / cliente</span>
                </div>
                <p className="text-3xl font-thin tabular-nums">{metricas.encontrosPorClienteAtivo.toFixed(1)}</p>
                <BenchmarkBadge valor={metricas.encontrosPorClienteAtivo} bench={getBench('meetings_per_client', BENCHMARKS.meetings_per_client)} />
              </CardContent>
            </Card>
          )}
        </div>
      </section>
      )}

      {/* Atalhos rápidos */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard titulo="Tarefas ativas" valor={minhasTarefas.filter(t => t.status !== 'concluida').length} icon={CheckSquare} size="compact" onClick={() => navigate('/consultor/tarefas')} />
        <StatCard titulo="Meus clientes" valor={meusClientes.length} icon={Users} size="compact" onClick={() => navigate('/consultor/clientes')} />
        <StatCard titulo="Meu perfil" valor="→" icon={UserCircle} size="compact" subtitulo="Indicadores e carteira" onClick={() => navigate('/consultor/meu-perfil')} />
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
