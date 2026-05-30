import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { StatusTag } from '@/components/StatusTag';
import { SectionHeader } from '@/components/SectionHeader';
import { DataTable, Column } from '@/components/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  CalendarDays, 
  BarChart3, 
  Clock, 
  Shield, 
  ShieldAlert, 
  DollarSign, 
  Activity, 
  Scale 
} from 'lucide-react';
import { ModalAlterarStatus } from '@/components/modals/ModalAlterarStatus';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminDashboardMetrics } from '@/hooks/admin/useAdminDashboardMetrics';
import { DashboardModal } from './AdminDashboardModals';
import { labelCapacidade, variantCapacidade, calculateCapacidade } from '@/data/consultorExtras';
import { startOfDay, format } from 'date-fns';
import type { StatusContrato } from '@/types';

interface ClientePriorizado {
  id: string;
  nomeFantasia: string;
  avatar_url?: string;
  consultorNome: string;
  status: StatusContrato;
  diasSemInteracao: number;
  motivoAlerta: string;
  acaoRecomendada: string;
  pontuacao: number;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data: metrics, isLoading, isError } = useAdminDashboardMetrics();
  
  const [statusModal, setStatusModal] = useState<{ open: boolean; clienteId: string; clienteNome: string; statusAtual: StatusContrato } | null>(null);
  const [activeModal, setActiveModal] = useState<{ open: boolean; title: string; data: any[] } | null>(null);

  const stats = useMemo(() => {
    if (!metrics) return null;

    const { clients, contracts, tasks, meetings, consultants, walletHealth } = metrics;
    const hojeStr = format(startOfDay(new Date()), 'yyyy-MM-dd');

    const priorizados: ClientePriorizado[] = clients
      .map(c => {
        let pontuacao = 0;
        const motivos: string[] = [];
        const acoes: string[] = [];

        if (c.status === 'suspenso' || c.status === 'bloqueado') {
          pontuacao += 30;
          motivos.push(c.status === 'suspenso' ? 'Cliente pausado' : 'Em risco contratual');
          acoes.push('Revisar situação contratual');
        }

        if (c.diasSemInteracao > 15) {
          pontuacao += 20;
          motivos.push(`${c.diasSemInteracao} dias sem interação`);
          acoes.push('Retomar contato urgente');
        } else if (c.diasSemInteracao > 8) {
          pontuacao += 10;
          motivos.push(`${c.diasSemInteracao} dias sem interação`);
          acoes.push('Agendar reunião');
        }

        const tarefasAtrasadas = tasks.filter(t => t.clienteId === c.id && t.status !== 'concluida' && t.dataVencimento && t.dataVencimento < hojeStr);
        if (tarefasAtrasadas.length > 0) {
          pontuacao += 15;
          motivos.push(`${tarefasAtrasadas.length} tarefas atrasadas`);
          acoes.push('Resolver pendências');
        }

        const tarefasImpedidas = tasks.filter(t => t.clienteId === c.id && t.status === 'impedida');
        if (tarefasImpedidas.length > 0) {
          pontuacao += 15;
          motivos.push('Tarefa impedida');
          acoes.push('Resolver bloqueio');
        }

        if (pontuacao === 0) return null;

        return {
          id: c.id,
          nomeFantasia: c.nomeFantasia,
          avatar_url: c.avatar_url,
          consultorNome: c.consultorNome,
          status: c.status,
          diasSemInteracao: c.diasSemInteracao,
          motivoAlerta: motivos.join(' · '),
          acaoRecomendada: acoes[0] || 'Avaliar situação',
          pontuacao
        };
      })
      .filter((c): c is ClientePriorizado => c !== null)
      .sort((a, b) => b.pontuacao - a.pontuacao);

    const ativos = clients.filter(c => c.status === 'ativo').length;
    const emRisco = clients.filter(c => (c.status === 'bloqueado' || c.status === 'suspenso')).length;
    const reunioesHoje = meetings.filter(m => m.meetingDate === hojeStr).length;
    const tarefasPendentes = tasks.filter(t => t.status !== 'concluida').length;
    const tarefasImpedidas = tasks.filter(t => t.status === 'impedida').length;
    
    const contratosAtivos = contracts.filter(c => c.status === 'ativo').length;
    const taxaRenovacao = contracts.length > 0 ? Math.round((contratosAtivos / contracts.length) * 100) : 0;
    const ltvTotal = contracts.reduce((acc, c) => acc + (c.valor || 0), 0);
    const ltvMedio = contracts.length > 0 ? ltvTotal / contracts.length : 0;

    const indiceMedio = clients.length > 0 ? Math.round(clients.reduce((acc, c) => acc + (c.indiceSeven || 0), 0) / clients.length) : 0;

    const consultoresStats = consultants.filter(p => p.role === 'consultor').map(cons => {
      const cap = calculateCapacidade(cons.id, { hours_available: cons.hours_available, max_clients: cons.max_clients }, clients, meetings, contracts);
      const numTarefas = tasks.filter(t => t.consultorId === cons.id && t.status !== 'concluida').length;
      return {
        ...cons,
        cap,
        numTarefas
      };
    });

    return {
      ativos, emRisco, totalContratos: contracts.length, reunioesHoje, tarefasPendentes, tarefasImpedidas,
      taxaRenovacao, ltvMedio, indiceMedio, priorizados, walletHealth, consultoresStats
    };
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="space-y-8 p-8">
        <Skeleton className="h-12 w-[300px]" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="p-8 text-center">
        <p className="text-seven-danger font-medium">Erro ao carregar dashboard admin.</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  const {
    ativos, emRisco, totalContratos, reunioesHoje, tarefasPendentes, tarefasImpedidas,
    taxaRenovacao, ltvMedio, indiceMedio, priorizados, walletHealth, consultoresStats
  } = stats;

  const columns: Column<ClientePriorizado>[] = [
    {
      key: 'nome',
      header: 'Cliente',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
            {c.avatar_url ? (
              <img src={c.avatar_url} alt={c.nomeFantasia} className="h-full w-full object-cover" />
            ) : (
              (c.nomeFantasia || 'C').charAt(0).toUpperCase()
            )}
          </div>
          <span className="font-medium">{c.nomeFantasia}</span>
        </div>
      ),
    },
    { key: 'consultor', header: 'Consultor', render: (c) => <span className="text-xs">{c.consultorNome}</span> },
    { key: 'status', header: 'Situação', render: (c) => <StatusTag label={c.status} /> },
    {
      key: 'dias',
      header: 'Dias s/ interação',
      render: (c) => (
        <span className={`font-mono text-sm font-bold ${c.diasSemInteracao > 15 ? 'text-seven-danger' : c.diasSemInteracao > 8 ? 'text-seven-warning' : ''}`}>
          {c.diasSemInteracao}d
        </span>
      ),
    },
    { key: 'motivo', header: 'Motivo do alerta', render: (c) => <span className="text-xs text-muted-foreground">{c.motivoAlerta}</span> },
    { key: 'acao', header: 'Ação recomendada', render: (c) => <span className="text-xs font-medium">{c.acaoRecomendada}</span> },
    {
      key: 'acoes',
      header: '',
      render: (c) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setStatusModal({ open: true, clienteId: c.id, clienteNome: c.nomeFantasia, statusAtual: c.status }); }}>
          <Shield className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-12 pb-12">
      <PageHeader titulo="Dashboard Global" subtitulo="Visão consolidada da operação" />

      {/* ─── Nível 1: Saúde da Carteira ─── */}
      <section>
        <SectionHeader overline="Painel de saúde" titulo="Saúde da Carteira" descricao="Leitura real do estado operacional" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <StatCard
            titulo="Em dia"
            valor={walletHealth.emDia}
            subtitulo="Interação há ≤ 8 dias"
            icon={Activity}
            variant="success"
            onClick={() => setActiveModal({ open: true, title: 'Clientes em dia', data: metrics.clients.filter(c => c.diasSemInteracao <= 8) })}
          />
          <StatCard
            titulo="Atenção"
            valor={walletHealth.atencao}
            subtitulo="Sem interação há 9-15 dias"
            icon={Clock}
            variant="warning"
            onClick={() => setActiveModal({ open: true, title: 'Clientes em atenção', data: metrics.clients.filter(c => c.diasSemInteracao > 8 && c.diasSemInteracao <= 15) })}
          />
          <StatCard
            titulo="Crítico"
            valor={walletHealth.critico}
            subtitulo="Sem interação há > 15 dias"
            icon={AlertTriangle}
            variant="danger"
            onClick={() => setActiveModal({ open: true, title: 'Clientes em situação crítica', data: metrics.clients.filter(c => c.diasSemInteracao > 15) })}
          />
          <StatCard
            titulo="Índice Seven"
            valor={indiceMedio}
            subtitulo="Média geral da carteira"
            icon={BarChart3}
            variant={indiceMedio > 70 ? 'success' : indiceMedio > 40 ? 'warning' : 'danger'}
          />
          <StatCard
            titulo="Prioridades"
            valor={priorizados.length}
            subtitulo="Clientes que exigem ação"
            icon={AlertTriangle}
            variant={priorizados.length > 0 ? 'danger' : 'success'}
            onClick={() => setActiveModal({ open: true, title: 'Prioridades de hoje', data: priorizados })}
          />
        </div>
      </section>

      {/* ─── Nível 2: Clientes que exigem ação ─── */}
      <section>
        <SectionHeader overline="Ação requerida" titulo="Clientes que exigem ação hoje" descricao={`${priorizados.length} prioridades identificadas`} />
        <Card className={priorizados.length > 0 ? 'border-seven-danger/30' : ''}>
          <CardContent className="p-0">
            <DataTable data={priorizados} columns={columns} onRowClick={(c) => navigate(`/admin/cliente/${c.id}`)} emptyMessage="Nenhum cliente em situação crítica." />
          </CardContent>
        </Card>
      </section>

      {/* ─── Nível 3: Sinais de Alerta Contratual ─── */}
      <section>
        <SectionHeader overline="Saúde contratual e risco" titulo="Sinais de Alerta" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard titulo="Contratos em risco" valor={emRisco} icon={ShieldAlert} variant="danger" subtitulo="Status bloqueado/suspenso" />
          <StatCard titulo="Bloqueados" valor={stats.emRisco} icon={ShieldAlert} variant="danger" subtitulo="Risco operacional ativo" />
          <StatCard titulo="Tarefas impedidas" valor={tarefasImpedidas} icon={Clock} variant="warning" subtitulo="Bloqueios operacionais" />
          <StatCard titulo="Potencial Upsell" valor={metrics.clients.filter(c => c.potencialUpsell).length} icon={DollarSign} variant="success" subtitulo="Oportunidades mapeadas" />
        </div>
      </section>

      {/* ─── Nível 4: Operação ─── */}
      <section>
        <SectionHeader overline="Operação" titulo="Carteira e produtividade" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard size="compact" titulo="Clientes ativos" valor={ativos} icon={Users} />
          <StatCard size="compact" titulo="Contratos" valor={totalContratos} icon={FileText} />
          <StatCard size="compact" titulo="Reuniões hoje" valor={reunioesHoje} icon={CalendarDays} />
          <StatCard size="compact" titulo="Tarefas pendentes" valor={tarefasPendentes} icon={Clock} />
          <StatCard size="compact" titulo="Renovação" valor={`${taxaRenovacao}%`} icon={TrendingUp} />
          <StatCard size="compact" titulo="LTV médio" valor={`R$ ${Math.round(ltvMedio).toLocaleString('pt-BR')}`} icon={DollarSign} />
        </div>
      </section>

      {/* ─── Time ─── */}
      <section>
        <SectionHeader overline="Time" titulo="Produtividade dos consultores" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {consultoresStats.map(cons => (
            <Card key={cons.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/admin/consultores/${cons.id}`)}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-sm">{cons.full_name}</p>
                  <StatusTag label={labelCapacidade[cons.cap.status]} variant={variantCapacidade[cons.cap.status]} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center border-t pt-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Clientes</p>
                    <p className="text-sm font-bold">{cons.cap.clientesAtivos}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Tarefas</p>
                    <p className="text-sm font-bold">{cons.numTarefas}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Ocupação</p>
                    <p className="text-sm font-bold">{cons.cap.ocupacaoPct}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Balanceamento */}
        <div className="mt-4">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scale className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold text-sm">Balanceamento da Carteira</p>
                  <p className="text-xs text-muted-foreground">Ocupação média do time: {Math.round(consultoresStats.reduce((acc, c) => acc + c.cap.ocupacaoPct, 0) / (consultoresStats.length || 1))}%</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/consultores')}>Ver detalhes</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Atalhos */}
      <section>
        <SectionHeader overline="Atalhos" titulo="Navegação rápida" />
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/clientes')}><Users className="h-4 w-4 mr-2" /> Clientes e Contratos</Button>
          <Button variant="outline" onClick={() => navigate('/admin/inteligencia')}><BarChart3 className="h-4 w-4 mr-2" /> Inteligência de Mercado</Button>
          <Button variant="outline" onClick={() => navigate('/admin/consultores')}><Users className="h-4 w-4 mr-2" /> Usuários</Button>
        </div>
      </section>

      {statusModal && (
        <ModalAlterarStatus 
          open={statusModal.open} 
          onClose={() => setStatusModal(null)} 
          clienteNome={statusModal.clienteNome} 
          statusAtual={statusModal.statusAtual} 
        />
      )}

      {activeModal && (
        <DashboardModal 
          open={activeModal.open} 
          onOpenChange={(open) => !open && setActiveModal(null)} 
          title={activeModal.title} 
          data={activeModal.data} 
        />
      )}
    </div>
  );
}
