import { useMemo, useState, useEffect } from 'react';
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
import { useConsultores } from '@/hooks/useConsultores';
import { ConsultorModal } from '@/components/modals/ConsultorModal';
import { useToast } from '@/hooks/use-toast';
import {
  Users, AlertTriangle, UserCheck, UserX, FileText,
  CalendarCheck, CalendarDays, TrendingUp, CheckCircle2,
  Clock, Ban, AlertCircle, Flame, ArrowUpRight, Download, Mail, Phone, MapPin,
  Briefcase, DollarSign, Banknote, Activity, XCircle, UserMinus, Edit, Plug, Calendar, ExternalLink, RefreshCw
} from 'lucide-react';
import { useMyPermissions } from '@/hooks/useConsultantPermissions';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { updateConsultant, isProcessing } = useConsultores();
  const { can } = useMyPermissions();

  const { clientes, isLoading: loadingClientes } = useClientes();
  const { reunioes, isLoading: loadingReunioes } = useReunioes();
  const { tarefas, isLoading: loadingTarefas } = useTarefas();
  const { contratos, isLoading: loadingContratos } = useContratos();
  const queryClient = useQueryClient();

  // Calendly Integration State
  const { data: calendlyIntegration, isLoading: loadingIntegration } = useQuery({
    queryKey: ['calendly-integration', consultorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultant_calendar_integrations')
        .select('*')
        .eq('consultant_id', consultorId)
        .eq('provider', 'calendly')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!consultorId
  });

  // Calendly Event Types
  const { data: calendlyEventTypes, isLoading: loadingEventTypes } = useQuery({
    queryKey: ['calendly-event-types', consultorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultant_calendly_event_types')
        .select('*')
        .eq('consultant_id', consultorId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!consultorId && !!calendlyIntegration
  });

  const handleSetDefaultEventType = async (uri: string, url: string) => {
    try {
      // 1. Update table
      await supabase
        .from('consultant_calendly_event_types')
        .update({ is_default: false })
        .eq('consultant_id', consultorId);
      
      await supabase
        .from('consultant_calendly_event_types')
        .update({ is_default: true })
        .eq('calendly_event_type_uri', uri);

      // 2. Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          calendly_event_type_uri: uri,
          calendly_scheduling_url: url
        })
        .eq('id', consultorId);

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Tipo de evento padrão atualizado.' });
      queryClient.invalidateQueries({ queryKey: ['calendly-event-types', consultorId] });
      queryClient.invalidateQueries({ queryKey: ['profiles', consultorId] });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleConnectCalendly = () => {
    toast({ title: 'OAuth Calendly', description: 'Redirecionando para autorização...' });
    const client_id = 'CALENDLY_CLIENT_ID'; 
    // We use a specific redirect URI that matches what's configured in Calendly dashboard
    const redirect_uri = encodeURIComponent(window.location.origin + window.location.pathname);
    const url = `https://auth.calendly.com/oauth/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redirect_uri}`;
    window.location.href = url;
  };

  useEffect(() => {
    // Handle OAuth Callback if code is in URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && modo === 'consultor') {
      const exchangeCode = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('calendly-oauth', {
            body: { action: 'exchange_code', code }
          });
          if (error) throw error;
          toast({ title: 'Sucesso!', description: 'Calendly conectado com sucesso.' });
          queryClient.invalidateQueries({ queryKey: ['calendly-integration', consultorId] });
          queryClient.invalidateQueries({ queryKey: ['profiles', consultorId] });
          // Clear URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error: any) {
          console.error('Error exchanging code:', error);
          toast({ title: 'Erro ao conectar', description: error.message, variant: 'destructive' });
        }
      };
      exchangeCode();
    }
  }, [consultorId, modo, queryClient]);
  
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

  useEffect(() => {
    const fetchConsultor = async () => {
      setLoadingConsultor(true);
      const { data, error } = await supabase.from('profiles').select('*').eq('id', consultorId).single();
      if (error) {
        console.error("Erro ao buscar consultor:", error);
      }
      if (data) setConsultor(data);
      setLoadingConsultor(false);
    };
    fetchConsultor();
  }, [consultorId]);

  const handleUpdateProfile = async (userData: any) => {
    try {
      await updateConsultant({ ...userData, id: consultorId });
      // Refresh local state
      const { data } = await supabase.from('profiles').select('*').eq('id', consultorId).single();
      if (data) setConsultor(data);
      toast({
        title: "Perfil atualizado com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Não foi possível atualizar o perfil.",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {consultor.phone || consultor.telefone ? (consultor.phone || consultor.telefone) : 'Telefone não informado'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {consultor.city || consultor.cidade || consultor.state || consultor.estado ? 
                    `${consultor.city || consultor.cidade || '—'}/${consultor.state || consultor.estado || '—'}` : 
                    'Localização não informada'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Entrada: {(consultor.entry_date || consultor.meetingDateEntrada) ? (consultor.entry_date || consultor.meetingDateEntrada).split('-').reverse().join('/') : '—'}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0 self-start">
              {(modo === 'admin' ? can('consultores', 'edit') : can('perfil', 'edit')) && (
                <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" /> {modo === 'admin' ? 'Editar Usuário' : 'Editar Perfil'}
                </Button>
              )}
              {modo === 'admin' && onExportar && (
                <Button variant="outline" size="sm" onClick={onExportar}>
                  <Download className="h-4 w-4 mr-2" /> Exportar Visão
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1.1 Integração Calendly */}
      <Card className="overflow-hidden border-blue-100 bg-blue-50/10">
        <CardHeader className="border-b border-blue-50 bg-blue-50/30 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-blue-900">
              <Calendar className="h-5 w-5 text-blue-600" /> Integração Calendly
            </CardTitle>
            {calendlyIntegration ? (
              <StatusTag label="Conectado" variant="success" />
            ) : (
              <StatusTag label="Não Conectado" variant="neutral" />
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <p className="text-sm text-blue-800/80 leading-relaxed">
                Conecte sua conta do Calendly para permitir que seus clientes agendem encontros diretamente através do Portal do Cliente. Isso sincroniza automaticamente sua disponibilidade e cria reuniões no sistema.
              </p>
              {calendlyIntegration && (
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="bg-white/80 border border-blue-100 rounded-lg p-3 flex flex-col min-w-[200px]">
                    <span className="text-[10px] font-black uppercase text-blue-600/60 tracking-wider">Conta Vinculada</span>
                    <span className="text-sm font-bold text-blue-900 truncate">{calendlyIntegration.provider_user_uri?.replace('https://api.calendly.com/users/', '') || 'Ativa'}</span>
                  </div>
                  <div className="bg-white/80 border border-blue-100 rounded-lg p-3 flex flex-col min-w-[150px]">
                    <span className="text-[10px] font-black uppercase text-blue-600/60 tracking-wider">Conectado em</span>
                    <span className="text-sm font-bold text-blue-900">{new Date(calendlyIntegration.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0">
              {calendlyIntegration ? (
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 h-11 px-6 font-bold"
                    onClick={handleConnectCalendly}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Reconectar
                  </Button>
                </div>
              ) : (
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 h-11 px-8 font-bold"
                  onClick={handleConnectCalendly}
                >
                  <Plug className="h-4 w-4 mr-2" /> Conectar Calendly
                </Button>
              )}
            </div>
          </div>

          {calendlyEventTypes && calendlyEventTypes.length > 0 && (
            <div className="mt-8 pt-8 border-t border-blue-50">
              <h4 className="text-[10px] font-black uppercase text-blue-600/60 tracking-widest mb-4">Selecione o Tipo de Evento para Clientes</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {calendlyEventTypes.map((et: any) => (
                  <Card 
                    key={et.id} 
                    className={cn(
                      "p-4 cursor-pointer transition-all border-2",
                      et.is_default ? "border-blue-500 bg-blue-50/20 shadow-md" : "border-transparent bg-white hover:border-blue-200"
                    )}
                    onClick={() => handleSetDefaultEventType(et.calendly_event_type_uri, et.calendly_scheduling_url)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      {et.is_default && <StatusTag label="Padrão" variant="info" />}
                    </div>
                    <p className="text-sm font-bold text-blue-900 mb-1">{et.name}</p>
                    <p className="text-[10px] text-blue-600/70 font-medium">{et.duration} minutos</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
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

      <ConsultorModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateProfile}
        consultor={consultor}
        isProcessing={isProcessing}
        modo={modo}
      />
    </div>
  );
};
