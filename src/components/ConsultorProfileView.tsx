import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { StatusTag } from '@/components/StatusTag';
import { DataTable, Column } from '@/components/DataTable';
import { TimelineCard } from '@/components/TimelineCard';
import {
  labelEspecialidade, labelStatus, labelRisco, labelEngajamento, variantEngajamento, calcularEngajamento,
} from '@/data/mockData';
import { useClientes } from '@/hooks/useClientes';
import { useReunioes } from '@/hooks/useReunioes';
import { useTarefas } from '@/hooks/useTarefas';
import { useContratos } from '@/hooks/useContratos';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { calculateCapacidade, getAlertaCapacidadeFromData, labelCapacidade, variantCapacidade } from '@/data/consultorExtras';
import { CapacityGauge } from '@/components/CapacityGauge';
import type { Cliente, Reuniao, Tarefa, TimelineEvent } from '@/types';
import {
  Users, AlertTriangle, UserCheck, UserX, FileText,
  CalendarCheck, CalendarDays, TrendingUp, CheckCircle2,
  Clock, Ban, AlertCircle, Flame, ArrowUpRight, Download, Mail, Phone, MapPin,
  Briefcase, DollarSign, Banknote, Activity, XCircle, UserMinus,
} from 'lucide-react';

interface ConsultorProfileViewProps {
  consultorId: string;
  modo: 'admin' | 'consultor';
  onExportar?: () => void;
}

type CarteiraFilter = 'todos' | 'risco' | 'bloqueados' | 'sem_interacao';

export const ConsultorProfileView = ({ consultorId, modo, onExportar }: ConsultorProfileViewProps) => {
  const navigate = useNavigate();
  const hoje = new Date().toISOString().slice(0, 10);
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const seteDiasAtras = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const [carteiraFilter, setCarteiraFilter] = useState<CarteiraFilter>('todos');

  const { clientes, isLoading: loadingClientes } = useClientes();
  const { reunioes, isLoading: loadingReunioes } = useReunioes();
  const { tarefas, isLoading: loadingTarefas } = useTarefas();
  const { contratos, isLoading: loadingContratos } = useContratos();
  
  // Clientes are already filtered in useClientes hook for non-admins if profile is consultor
  const meusClientes = useMemo(() => {
    if (!clientes) return [];
    return clientes.filter(c => c.consultorId === consultorId);
  }, [clientes, consultorId]);

  const minhasReunioes = useMemo(() => {
    if (!reunioes) return [];
    return reunioes.filter(r => r.consultorId === consultorId);
  }, [reunioes, consultorId]);

  const minhasTarefas = useMemo(() => {
    if (!tarefas) return [];
    return tarefas.filter(t => t.consultorId === consultorId);
  }, [tarefas, consultorId]);

  const meusContratos = useMemo(() => {
    if (!contratos) return [];
    return contratos.filter(c => c.consultorId === consultorId);
  }, [contratos, consultorId]);
  const [consultor, setConsultor] = useState<any>(null);
  const [loadingConsultor, setLoadingConsultor] = useState(true);

  useMemo(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', consultorId).single();
    if (data) setConsultor(data);
    setLoadingConsultor(false);
  }, [consultorId]);

  const isLoading = loadingClientes || loadingReunioes || loadingTarefas || loadingContratos || loadingConsultor;

  // Filtered collections already computed above


  // Carteira
  const clientesAtivos = meusClientes.filter(c => c.status === 'ativo').length;
  const clientesOnboarding = meusClientes.filter(c => c.status === 'em_onboarding' || c.faseMetodologica === 'diagnostico').length;
  const clientesEmRisco = meusClientes.filter(c => calcularEngajamento(c.id) === 'critico').length;
  const clientesBloqueados = meusClientes.filter(c => c.status === 'bloqueado' || c.status === 'suspenso' || c.status === 'cancelado' || c.status === 'churn' || c.status === 'encerrado').length;

  // Performance
  const reunioesRealizadas = minhasReunioes.filter(r => r.status === 'realizada').length;
  const reunioesPrevistas = minhasReunioes.filter(r => r.status === 'agendada').length;
  const totalReunioes = minhasReunioes.length;
  const taxaExecucao = totalReunioes > 0 ? Math.round((reunioesRealizadas / totalReunioes) * 100) : 0;
  const atasNoPrazo = minhasReunioes.filter(r => r.status === 'realizada' && r.ata).length;
  const tarefasConcluidas = minhasTarefas.filter(t => t.status === 'concluida').length;
  const tarefasEmAtraso = minhasTarefas.filter(t => t.dataVencimento < hoje && t.status !== 'concluida').length;
  const tarefasImpedidas = minhasTarefas.filter(t => t.status === 'impedida').length;
  const clientesSemInteracao = meusClientes.filter(c => c.ultimaInteracao < seteDiasAtras).length;
  const clientesCriticos = meusClientes.filter(c => calcularEngajamento(c.id) === 'critico').length;
  const potencialUpsell = meusClientes.filter(c => c.potencialUpsell).length;

  // Carteira filtrada
  const carteiraFiltrada = useMemo(() => {
    let list = meusClientes;
    if (carteiraFilter === 'risco') list = list.filter(c => calcularEngajamento(c.id) !== 'em_dia');
    if (carteiraFilter === 'bloqueados') list = list.filter(c => c.status === 'bloqueado' || c.status === 'suspenso' || c.status === 'cancelado' || c.status === 'churn' || c.status === 'encerrado');
    if (carteiraFilter === 'sem_interacao') list = list.filter(c => c.ultimaInteracao < seteDiasAtras);
    return list;
  }, [meusClientes, carteiraFilter, seteDiasAtras]);

  // Enrich clients with last meeting and next action
  const carteiraEnriquecida = useMemo(() => {
    return carteiraFiltrada.map(cl => {
      const reunioesCliente = minhasReunioes.filter(r => r.clienteId === cl.id);
      const ultimaReuniao = reunioesCliente
        .filter(r => r.status === 'realizada')
        .sort((a, b) => b.data.localeCompare(a.data))[0];
      const tarefasCliente = minhasTarefas.filter(t => t.clienteId === cl.id && t.status !== 'concluida');
      const proximaAcao = tarefasCliente.sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))[0];
      return {
        ...cl,
        ultimaReuniaoData: ultimaReuniao?.data || '—',
        proximaAcaoTitulo: proximaAcao?.titulo || '—',
      };
    });
  }, [carteiraFiltrada, minhasReunioes, minhasTarefas]);

  // Próximas reuniões
  const proximasReunioes = useMemo(() =>
    minhasReunioes
      .filter(r => r.meetingDate >= hoje && r.status === 'agendada')
      .sort((a, b) => a.data.localeCompare(b.data) || a.startTime.localeCompare(b.startTime))
      .slice(0, 10),
    [minhasReunioes, hoje]
  );

  // Tarefas prioritárias (pendentes + vencidas)
  const tarefasPrioritarias = useMemo(() =>
    minhasTarefas
      .filter(t => t.status !== 'concluida')
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
      .slice(0, 10),
    [minhasTarefas]
  );

  // Timeline (últimos 5 eventos)
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    const events: TimelineEvent[] = [];
    minhasReunioes
      .filter(r => r.status === 'realizada')
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, 3)
      .forEach(r => events.push({
        id: r.id, data: r.meetingDate, tipo: 'reuniao',
        titulo: `${r.tipo} — ${r.clienteNome}`, descricao: r.title, status: r.status,
      }));
    minhasTarefas
      .filter(t => t.status === 'concluida')
      .sort((a, b) => b.dataVencimento.localeCompare(a.dataVencimento))
      .slice(0, 2)
      .forEach(t => events.push({
        id: t.id, data: t.dataVencimento, tipo: 'tarefa',
        titulo: t.titulo, descricao: t.descricao, status: t.status,
      }));
    return events.sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5);
  }, [minhasReunioes, minhasTarefas]);

  const reuniaoColumns: Column<Reuniao>[] = [
    { key: 'data', header: 'Data', render: r => r.meetingDate.split('-').reverse().join('/') },
    { key: 'hora', header: 'Hora', render: r => r.startTime },
    { key: 'cliente', header: 'Cliente', render: r => r.clienteNome },
    { key: 'tipo', header: 'Tipo', render: r => r.tipo },
  ];

  const prioridadeVariant = (p: string): 'danger' | 'warning' | 'success' | 'neutral' => {
    if (p === 'alto') return 'danger';
    if (p === 'medio') return 'warning';
    if (p === 'baixo') return 'success';
    return 'neutral';
  };

  const tarefaColumns: Column<Tarefa>[] = [
    { key: 'titulo', header: 'Tarefa', render: t => t.titulo },
    { key: 'cliente', header: 'Cliente', render: t => t.clienteNome },
    { key: 'prioridade', header: 'Prioridade', render: t => <StatusTag label={labelRisco[t.prioridade]} variant={prioridadeVariant(t.prioridade)} /> },
    { key: 'status', header: 'Status', render: t => <StatusTag label={t.status.replace('_', ' ')} /> },
    { key: 'vencimento', header: 'Vencimento', render: t => t.dataVencimento.split('-').reverse().join('/') },
  ];

  type CarteiraRow = typeof carteiraEnriquecida[number];

  const carteiraColumns: Column<CarteiraRow>[] = [
    {
      key: 'cliente',
      header: 'Cliente',
      render: (c) => (
        <div>
          <p className="text-sm font-medium text-foreground">{c.nomeFantasia}</p>
          <p className="text-xs text-muted-foreground">{c.segmento}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: c => <StatusTag label={labelStatus[c.status]} /> },
    { key: 'risco', header: 'Risco', render: c => { const e = calcularEngajamento(c.id); return <StatusTag label={labelEngajamento[e]} variant={variantEngajamento[e]} />; } },
    { key: 'ultimaReuniao', header: 'Última Reunião', render: c => <span className="text-sm">{c.ultimaReuniaoData && c.ultimaReuniaoData !== '—' ? c.ultimaReuniaoData.split('-').reverse().join('/') : '—'}</span> },
    { key: 'ultimaInteracao', header: 'Última Interação', render: c => {
      if (!c.ultimaInteracao) return <span className="text-sm text-muted-foreground">—</span>;
      const old = c.ultimaInteracao < seteDiasAtras;
      return <span className={`text-sm ${old ? 'text-seven-danger font-medium' : ''}`}>{c.ultimaInteracao.split('-').reverse().join('/')}</span>;
    }},
    { key: 'proximaAcao', header: 'Próxima Ação', render: c => <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{c.proximaAcaoTitulo}</span> },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!consultor) {
    return <p className="text-muted-foreground text-center py-12">Consultor não encontrado.</p>;
  }

  const initials = (consultor.full_name || consultor.nome || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const carteiraFilterButtons: { key: CarteiraFilter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'risco', label: 'Em Risco' },
    { key: 'bloqueados', label: 'Bloqueados' },
    { key: 'sem_interacao', label: 'Sem Interação >7d' },
  ];

  return (
    <div className="space-y-12">
      {/* 1. Cabeçalho */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-foreground">{consultor.full_name || consultor.nome}</h2>
                <StatusTag label={consultor.status === 'ativo' ? 'Ativo' : 'Inativo'} variant={consultor.status === 'ativo' ? 'success' : 'neutral'} />
              </div>
              <p className="text-sm text-muted-foreground">{consultor.cargo || 'Consultor'} · {labelEspecialidade[consultor.specialty || consultor.especialidade]}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{consultor.email}</span>
                <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{consultor.phone || consultor.telefone || '—'}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{consultor.city || consultor.cidade || '—'}/{consultor.state || consultor.estado || '—'}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Entrada: {(consultor.entry_date || consultor.meetingDateEntrada || '').split('-').reverse().join('/')}</span>
              </div>
            </div>
            {modo === 'admin' && onExportar && (
              <Button variant="outline" size="sm" onClick={onExportar} className="shrink-0 self-start">
                <Download className="h-4 w-4 mr-2" /> Exportar Visão
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 1.5 Capacidade Operacional */}
      {(() => {
        const cap = calculateCapacidade(
          consultorId, 
          { hours_available: consultor?.hours_available, max_clients: consultor?.max_clients }, 
          clientes || [], 
          reunioes || [], 
          contratos || []
        );
        const alerta = getAlertaCapacidadeFromData(cap);
        const alertBg =
          alerta?.variant === 'danger' ? 'border-seven-danger/40 bg-seven-danger/5' :
          alerta?.variant === 'warning' ? 'border-seven-warning/40 bg-seven-warning/5' :
          alerta?.variant === 'success' ? 'border-seven-success/40 bg-seven-success/5' :
          'border-border';
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" strokeWidth={1.5} /> Capacidade Operacional
              </h3>
              <StatusTag label={labelCapacidade[cap.status]} variant={variantCapacidade[cap.status]} />
            </div>
            {alerta && (
              <Card className={alertBg}>
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${
                    alerta.variant === 'danger' ? 'text-seven-danger' :
                    alerta.variant === 'warning' ? 'text-seven-warning' :
                    'text-seven-success'
                  }`} strokeWidth={1.5} />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">{alerta.label}</p>
                    <p className="text-muted-foreground">{alerta.mensagem}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <CapacityGauge value={cap.ocupacaoPct} label="% Ocupação" sublabel={`${cap.horasUtilizadasMes}h / ${cap.horasDisponiveis}h`} />
                <CapacityGauge value={cap.utilizacaoCarteiraPct} label="% Utilização carteira" sublabel={`${cap.clientesAtivos} / ${cap.maxClientes} clientes`} />
                <div className="md:col-span-2 grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-border p-3">
                    <p className="ui-overline">Horas disponíveis</p>
                    <p className="text-xl font-semibold tabular-nums">{cap.horasDisponiveis}h<span className="text-xs text-muted-foreground">/mês</span></p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="ui-overline">Horas utilizadas</p>
                    <p className="text-xl font-semibold tabular-nums">{cap.horasUtilizadasMes}h</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="ui-overline">Clientes ativos</p>
                    <p className="text-xl font-semibold tabular-nums">{cap.clientesAtivos}<span className="text-xs text-muted-foreground"> / {cap.maxClientes}</span></p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="ui-overline">LTV médio</p>
                    <p className="text-xl font-semibold tabular-nums">R$ {cap.ltvMedioCarteira.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {modo === 'consultor' && (
              <p className="text-xs text-muted-foreground italic">
                Capacidade configurada pela administração. Para alterações, fale com seu gestor.
              </p>
            )}
          </div>
        );
      })()}

      {/* 2. Resumo da carteira */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Resumo da Carteira</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard titulo="Clientes Ativos" valor={clientesAtivos} icon={UserCheck} variant="success" />
          <StatCard titulo="Em Onboarding" valor={clientesOnboarding} icon={Users} variant="info" />
          <StatCard titulo="Em Risco" valor={clientesEmRisco} icon={AlertTriangle} variant="warning" />
          <StatCard titulo="Bloqueados" valor={clientesBloqueados} icon={UserX} variant="danger" />
          <StatCard titulo="Contratos" valor={meusContratos.length} icon={FileText} variant="default" />
        </div>
      </div>

      {/* 2.5 Carteira do Consultor — DataTable detalhada */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" /> Carteira do Consultor
          </h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {carteiraFilterButtons.map(f => (
              <button
                key={f.key}
                onClick={() => setCarteiraFilter(f.key)}
                className={`px-2.5 py-1 rounded-md border transition-colors ${carteiraFilter === f.key ? 'bg-primary/10 border-primary/30 text-primary font-medium' : 'border-border text-muted-foreground hover:bg-muted'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <DataTable
              data={carteiraEnriquecida}
              columns={carteiraColumns}
              pageSize={10}
              onRowClick={(c) => navigate(modo === 'admin' ? `/admin/cliente/${c.id}` : `/consultor/cliente/${c.id}`)}
              emptyMessage="Nenhum cliente encontrado com este filtro."
            />
          </CardContent>
        </Card>
      </div>

      {/* 2.75 Atenção Imediata — clientes em risco da carteira */}
      {(() => {
        const clientesAtencao = meusClientes.filter(c => calcularEngajamento(c.id) !== 'em_dia');
        if (clientesAtencao.length === 0) return null;
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Flame className="h-5 w-5 text-seven-danger" /> Clientes que Precisam de Atenção
              <span className="text-sm font-normal text-muted-foreground">({clientesAtencao.length})</span>
            </h3>
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {clientesAtencao.slice(0, 6).map(c => (
                    <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/40 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{c.nomeFantasia}</p>
                        <p className="text-xs text-muted-foreground">{c.segmento} · {labelStatus[c.status]}</p>
                      </div>
                      {(() => { const e = calcularEngajamento(c.id); return <StatusTag label={labelEngajamento[e]} variant={variantEngajamento[e]} />; })()}
                      <Button variant="outline" size="sm" onClick={() => navigate(modo === 'admin' ? `/admin/cliente/${c.id}` : `/consultor/cliente/${c.id}`)}>
                        Ver cliente
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* 3. Indicadores de performance */}
      <div className="space-y-4">
        <div className="flex items-end justify-between flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-foreground">Indicadores de Performance</h3>
          <p className="text-sm text-muted-foreground">
            <span className={`font-semibold ${taxaExecucao >= 70 ? 'text-seven-success' : 'text-seven-warning'}`}>
              {reunioesRealizadas} de {totalReunioes}
            </span>{' '}
            reuniões realizadas — <span className="font-semibold text-foreground">{taxaExecucao}%</span> de aderência
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard titulo="Reuniões Realizadas" valor={reunioesRealizadas} icon={CalendarCheck} variant="success" />
          <StatCard titulo="Reuniões Previstas" valor={reunioesPrevistas} icon={CalendarDays} variant="info" />
          <StatCard titulo="Taxa de Execução" valor={`${taxaExecucao}%`} icon={TrendingUp} variant={taxaExecucao >= 70 ? 'success' : 'warning'} />
          <StatCard titulo="Atas no Prazo" valor={atasNoPrazo} icon={FileText} variant="success" />
          <StatCard titulo="Tarefas Concluídas" valor={tarefasConcluidas} icon={CheckCircle2} variant="success" />
          <StatCard titulo="Tarefas em Atraso" valor={tarefasEmAtraso} icon={Clock} variant={tarefasEmAtraso > 0 ? 'danger' : 'success'} />
          <StatCard titulo="Tarefas Impedidas" valor={tarefasImpedidas} icon={Ban} variant={tarefasImpedidas > 0 ? 'warning' : 'success'} />
          <StatCard titulo="Sem Interação >7d" valor={clientesSemInteracao} icon={AlertCircle} variant={clientesSemInteracao > 0 ? 'warning' : 'success'} />
          <StatCard titulo="Clientes Críticos" valor={clientesCriticos} icon={Flame} variant={clientesCriticos > 0 ? 'danger' : 'success'} />
          <StatCard titulo="Potencial Upsell" valor={potencialUpsell} icon={ArrowUpRight} variant="info" />
        </div>
      </div>

      {/* 4. Agenda e entregas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Agenda e Entregas</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Próximas Reuniões</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={proximasReunioes}
                columns={reuniaoColumns}
                pageSize={5}
                emptyMessage="Nenhuma reunião agendada."
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tarefas Prioritárias</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={tarefasPrioritarias}
                columns={tarefaColumns}
                pageSize={5}
                onRowClick={(t) => navigate(modo === 'admin' ? `/admin/cliente/${t.clienteId}` : `/consultor/cliente/${t.clienteId}`)}
                emptyMessage="Nenhuma tarefa pendente."
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4.5 Desempenho de Repasses */}
      {(() => {
        const managedValue = (meusContratos || []).reduce((sum, con) => sum + (con.valor || 0), 0);
        const mesAtual = managedValue * 0.3;
        const rep = {
          mesAtual,
          mesAnterior: mesAtual * 0.95, // Dummy calculation for view
          variacaoPct: 5,
          acumuladoAno: mesAtual * 5,
          serie6m: [
            { mesLabel: 'JAN', valor: mesAtual * 0.8 },
            { mesLabel: 'FEV', valor: mesAtual * 0.85 },
            { mesLabel: 'MAR', valor: mesAtual * 0.9 },
            { mesLabel: 'ABR', valor: mesAtual * 0.92 },
            { mesLabel: 'MAI', valor: mesAtual * 0.95 },
            { mesLabel: 'JUN', valor: mesAtual },
          ],
          consultoriasMes: minhasReunioes.filter(r => r.status === 'realizada' && r.meetingDate >= inicioMes).length,
          consultoriasPrevistas: minhasReunioes.filter(r => r.status === 'agendada').length,
          taxaExecucao: taxaExecucao,
        };
        const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
        const maxRep = Math.max(...rep.serie6m.map(m => m.valor), 1);
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" strokeWidth={1.5} /> Desempenho de Repasses
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard titulo="Repasse mês atual" valor={fmtBRL(rep.mesAtual)} icon={DollarSign} variant="success" />
              <StatCard titulo="Mês anterior" valor={fmtBRL(rep.mesAnterior)} icon={DollarSign} />
              <StatCard
                titulo="Variação"
                valor={`${rep.variacaoPct > 0 ? '+' : ''}${rep.variacaoPct}%`}
                icon={TrendingUp}
                variant={rep.variacaoPct >= 0 ? 'success' : 'danger'}
              />
              <StatCard titulo="Acumulado no ano" valor={fmtBRL(rep.acumuladoAno)} icon={ArrowUpRight} variant="info" />
            </div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Evolução · últimos 6 meses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3 h-32">
                  {rep.serie6m.map((m, i) => {
                    const h = Math.max(8, (m.valor / maxRep) * 100);
                    const isLast = i === rep.serie6m.length - 1;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {(m.valor / 1000).toFixed(0)}k
                        </span>
                        <div
                          className={`w-full rounded-sm ${isLast ? 'bg-primary' : 'bg-foreground/30'}`}
                          style={{ height: `${h}%` }}
                          title={fmtBRL(m.valor)}
                        />
                        <span className="text-[10px] text-muted-foreground uppercase">{m.mesLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* 4.6 Resumo de Consultorias */}
      {(() => {
        const consultoriasMes = minhasReunioes.filter(r => r.status === 'realizada' && r.meetingDate >= inicioMes).length;
        const totalReunioes = minhasReunioes.filter(r => r.meetingDate >= inicioMes).length;
        const tExec = totalReunioes > 0 ? Math.round((consultoriasMes / totalReunioes) * 100) : 0;
        const horasMes = Math.round(minhasReunioes.filter(r => r.status === 'realizada' && r.meetingDate >= inicioMes).reduce((a, r) => a + (r.duracao || 60) / 60, 0));
        
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" strokeWidth={1.5} /> Resumo de Consultorias
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard titulo="Realizadas no mês" valor={consultoriasMes} icon={CalendarCheck} variant="success" />
              <StatCard titulo="Horas trabalhadas" valor={`${horasMes}h`} icon={Clock} />
              <StatCard titulo="Agendadas" valor={minhasReunioes.filter(r => r.status === 'agendada').length} icon={CalendarDays} />
              <StatCard titulo="Taxa de execução" valor={`${tExec}%`} icon={TrendingUp} variant={tExec >= 80 ? 'success' : 'warning'} />
            </div>
          </div>
        );
      })()}

      {/* 5. Histórico */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Histórico Recente</h3>
        <Card>
          <CardContent className="p-6">
            {timelineEvents.length > 0 ? (
              <div>
                {timelineEvents.map((ev, i) => (
                  <TimelineCard
                    key={ev.id}
                    data={ev.data}
                    tipo={ev.tipo}
                    titulo={ev.titulo}
                    descricao={ev.descricao}
                    isLast={i === timelineEvents.length - 1}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum evento recente.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{modo === 'admin' ? 'Observações Internas' : 'Observações sobre Performance'}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Consultor com boa taxa de execução e engajamento consistente com a carteira. Acompanhar clientes em risco de churn no próximo ciclo.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mudanças Recentes na Carteira</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-seven-success shrink-0" /> Novo cliente adicionado: EduFuturo</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-seven-warning shrink-0" /> Cliente Horizonte movido para "Em Risco"</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" /> Saúde & Vida em fase de encerramento</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
