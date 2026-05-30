import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { StatusTag } from '@/components/StatusTag';
import { SectionHeader } from '@/components/SectionHeader';
import { ListRow } from '@/components/ListRow';
import { DataTable, Column } from '@/components/DataTable';
import { labelStatus, labelEngajamento, variantEngajamento, calcularEngajamento } from '@/data/mockData';
import { getSevenData } from '@/data/sevenGestaoMock';
import { getCapacidade, getBalanceamento, labelCapacidade, variantCapacidade } from '@/data/consultorExtras';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, AlertTriangle, TrendingUp, CalendarDays, BarChart3, Clock, Shield, ShieldAlert, DollarSign, Activity, Lightbulb, Scale } from 'lucide-react';
import { ModalAlterarStatus } from '@/components/modals/ModalAlterarStatus';
import type { Cliente, StatusContrato, Contrato, Reuniao, Tarefa } from '@/types';
import { useClientes } from '@/hooks/useClientes';
import { useContratos } from '@/hooks/useContratos';
import { useReunioes } from '@/hooks/useReunioes';
import { useTarefas } from '@/hooks/useTarefas';
import { Skeleton } from '@/components/ui/skeleton';

interface ClientePriorizado extends Cliente {
  diasSemInteracao: number;
  ultimaReuniao: string | null;
  proximaReuniao: string | null;
  situacaoContrato: string;
  motivoAlerta: string;
  acaoRecomendada: string;
  pontuacao: number;
}

function calcularPriorizacao(clientes: Cliente[], contratos: Contrato[], reunioes: Reuniao[], tarefas: Tarefa[]): ClientePriorizado[] {
  const hoje = new Date();
  const hojeStr = hoje.toISOString().slice(0, 10);


  return (clientes || [])
    .map((c) => {
      let pontuacao = 0;
      const motivos: string[] = [];
      const acoes: string[] = [];

      const diffMs = hoje.getTime() - new Date(c.ultimaInteracao).getTime();
      const diasSemInteracao = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      if (c.status === 'suspenso' || c.status === 'bloqueado') {
        pontuacao += 30;
        motivos.push(c.status === 'suspenso' ? 'Cliente pausado' : 'Em risco contratual');
        acoes.push('Revisar situação contratual');
      }
      const eng = calcularEngajamento(c.id, reunioes);
      if (eng === 'critico') {
        pontuacao += 25;
        motivos.push(`Risco ${labelEngajamento[eng].toLowerCase()}`);
        acoes.push('Agendar reunião de recuperação');
      }

      if (diasSemInteracao > 15) {
        pontuacao += 15;
        motivos.push(`${diasSemInteracao} dias sem interação`);
        if (!acoes.some(a => a.includes('reunião'))) acoes.push('Retomar contato urgente');
      }
      const tarefasCliente = tarefas.filter(t => t.clienteId === c.id);
      const temImpedida = tarefasCliente.some(t => t.status === 'impedida');
      const temCritica = tarefasCliente.some(t => t.prioridade === 'critico' && t.status !== 'concluida');
      if (temImpedida || temCritica) {
        pontuacao += 10;
        if (temImpedida) motivos.push('Tarefa impedida');
        if (temCritica) motivos.push('Tarefa crítica pendente');
        acoes.push('Resolver impedimento');
      }
      if (c.potencialUpsell) {
        pontuacao += 5;
        motivos.push('Potencial de expansão');
        acoes.push('Explorar upsell');
      }

      if (pontuacao === 0) return null;

      const contrato = contratos.find(ct => ct.clienteId === c.id);
      const reunioesCliente = reunioes.filter(r => r.clienteId === c.id);
      const reunioesRealizadas = reunioesCliente.filter(r => r.status === 'realizada' && r.meetingDate <= hojeStr).sort((a, b) => b.data.localeCompare(a.data));
      const reunioesAgendadas = reunioesCliente.filter(r => r.status === 'agendada' && r.meetingDate >= hojeStr).sort((a, b) => a.data.localeCompare(b.data));

      return {
        ...c,
        diasSemInteracao,
        ultimaReuniao: reunioesRealizadas[0]?.data || null,
        proximaReuniao: reunioesAgendadas[0]?.data || null,
        situacaoContrato: contrato ? labelStatus[contrato.status] : '—',
        motivoAlerta: motivos.join(' · '),
        acaoRecomendada: acoes[0] || 'Avaliar situação',
        pontuacao,
      } as ClientePriorizado;
    })
    .filter((c): c is ClientePriorizado => c !== null)
    .sort((a, b) => b.pontuacao - a.pontuacao);
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [statusModal, setStatusModal] = useState<{ open: boolean; clienteNome: string; statusAtual: StatusContrato } | null>(null);
  const [balModalOpen, setBalModalOpen] = useState(false);
  const balanceamento = useMemo(() => getBalanceamento(), []);

  const { clientes, isLoading: loadingClientes } = useClientes();
  const { contratos, isLoading: loadingContratos } = useContratos();
  const { reunioes, isLoading: loadingReunioes } = useReunioes();
  const { tarefas, isLoading: loadingTarefas } = useTarefas();

  const isLoading = loadingClientes || loadingContratos || loadingReunioes || loadingTarefas;

  const stats = useMemo(() => {
    if (!clientes || !contratos || !reunioes || !tarefas) return null;

    const ativos = clientes.filter(c => c.status === 'ativo').length;
    const emRisco = clientes.filter(c => (c.status === 'bloqueado' || c.status === 'suspenso')).length;
    const totalContratos = contratos.length;
    const reunioesHoje = reunioes.filter(r => r.meetingDate === new Date().toISOString().slice(0, 10)).length;
    const tarefasPendentes = tarefas.filter(t => t.status !== 'concluida').length;
    const tarefasImpedidas = tarefas.filter(t => t.status === 'impedida').length;

    const contratosAtivos = contratos.filter(c => c.status === 'ativo').length;
    const taxaRenovacao = totalContratos > 0 ? Math.round((contratosAtivos / totalContratos) * 100) : 0;
    const ltvMedio = totalContratos > 0 ? contratos.reduce((a, c) => a + c.valor, 0) / totalContratos : 0;
    const ltvFormatado = `R$ ${Math.round(ltvMedio).toLocaleString('pt-BR')}`;
    const clientesBloqueados = clientes.filter(c => c.status === 'suspenso' || c.status === 'bloqueado').length;
    const indiceMedio = clientes.length > 0 ? Math.round(clientes.reduce((a, c) => a + (c.indiceSeven || 0), 0) / clientes.length) : 0;

    const priorizados = calcularPriorizacao(clientes, contratos, reunioes, tarefas);
    const upsell = clientes.filter(c => c.potencialUpsell);

    // Engajamento por dias sem reunião
    const engajamentoCounts = { em_dia: 0, atencao: 0, critico: 0, sem_dados: 0 };
    clientes.forEach(c => { 
      const e = calcularEngajamento(c.id, reunioes);
      if (e in engajamentoCounts) engajamentoCounts[e as keyof typeof engajamentoCounts]++; 
    });


    // Alertas operacionais
    const alertasCounts = { critico: 0, atencao: 0, oportunidade: 0 };
    clientes.forEach(c => {
      const data = getSevenData(c.id, c.faturamentoMensal);
      data.alertas.forEach(a => { 
        if (a.severidade in alertasCounts) alertasCounts[a.severidade as keyof typeof alertasCounts]++; 
      });
    });

    const saudeVariant: 'success' | 'warning' | 'danger' = indiceMedio >= 70 && clientesBloqueados <= 2 ? 'success' : indiceMedio >= 50 ? 'warning' : 'danger';

    return {
      ativos, emRisco, totalContratos, reunioesHoje, tarefasPendentes, tarefasImpedidas,
      taxaRenovacao, ltvFormatado, clientesBloqueados, indiceMedio, priorizados, upsell,
      engajamentoCounts, alertasCounts, saudeVariant
    };
  }, [clientes, contratos, reunioes, tarefas]);

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

  if (!stats) return null;

  const {
    ativos, emRisco, totalContratos, reunioesHoje, tarefasPendentes, tarefasImpedidas,
    taxaRenovacao, ltvFormatado, clientesBloqueados, indiceMedio, priorizados, upsell,
    engajamentoCounts, alertasCounts, saudeVariant
  } = stats;


  const columns: Column<ClientePriorizado>[] = [
    { key: 'nome', header: 'Cliente', render: (c) => <span className="font-medium">{c.nomeFantasia}</span> },
    { key: 'consultor', header: 'Usuário', render: (c) => <span className="text-xs">{c.consultorNome}</span> },
    { key: 'situacao', header: 'Situação', render: (c) => <StatusTag label={c.situacaoContrato} /> },
    { key: 'risco', header: 'Risco', render: (c) => { const e = calcularEngajamento(c.id, reunioes); return <StatusTag label={labelEngajamento[e]} variant={e === 'critico' ? 'danger' : e === 'atencao' ? 'warning' : e === 'sem_dados' ? 'info' : 'success'} />; } },
    {
      key: 'dias', header: 'Dias s/ interação', className: 'w-[100px]', render: (c) => (
        <span className={`font-mono text-sm font-bold ${c.diasSemInteracao > 20 ? 'text-seven-danger' : c.diasSemInteracao > 10 ? 'text-seven-warning' : 'text-muted-foreground'}`}>
          {c.diasSemInteracao}d
        </span>
      ),
    },
    { key: 'motivo', header: 'Motivo do alerta', className: 'max-w-[200px]', render: (c) => <span className="text-xs text-muted-foreground leading-tight">{c.motivoAlerta}</span> },
    { key: 'acao', header: 'Ação recomendada', className: 'max-w-[180px]', render: (c) => <span className="text-xs font-medium">{c.acaoRecomendada}</span> },
    {
      key: 'acoes', header: '', className: 'w-[60px]', render: (c) => (
        (calcularEngajamento(c.id, reunioes) === 'critico') ? (
          <Button variant="ghost" size="sm" className="text-seven-danger" onClick={(e) => { e.stopPropagation(); setStatusModal({ open: true, clienteNome: c.nomeFantasia, statusAtual: c.status }); }}>
            <Shield className="h-3.5 w-3.5" />
          </Button>
        ) : null
      ),
    },
  ];

  return (
    <div className="space-y-14">
      <PageHeader titulo="Dashboard Global" subtitulo="Visão executiva da operação" />

      {/* ─── Nível 1: Hero KPI — Saúde da Carteira ─── */}
      <section>
        <SectionHeader overline="Painel de saúde" titulo="Saúde da Carteira" descricao="Leitura única do estado operacional" />

        {/* Cards de risco de churn por dias sem reunião */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <StatCard
            titulo="Em dia"
            valor={engajamentoCounts.em_dia}
            subtitulo="Reunião nos últimos 8 dias"
            icon={Activity}
            variant="success"
            onClick={() => navigate('/admin/clientes')}
          />
          <StatCard
            titulo="Atenção"
            valor={engajamentoCounts.atencao}
            subtitulo="Sem reunião há 9–15 dias"
            icon={Clock}
            variant="warning"
            onClick={() => navigate('/admin/clientes')}
          />
          <StatCard
            titulo="Crítico"
            valor={engajamentoCounts.critico}
            subtitulo="Sem reunião há mais de 15 dias"
            icon={AlertTriangle}
            variant="danger"
            onClick={() => navigate('/admin/clientes')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StatCard
            size="hero"
            titulo="Índice Seven médio"
            valor={indiceMedio}
            subtitulo={`${clientesBloqueados} em situação crítica · ${ativos} ativos`}
            icon={Activity}
            variant={saudeVariant}
            className="lg:col-span-2"
            onClick={() => navigate('/admin/inteligencia')}
          />
          {priorizados.length > 0 ? (
            <StatCard
              size="hero"
              titulo="Prioridades de hoje"
              valor={priorizados.length}
              subtitulo="Clientes que exigem ação"
              icon={AlertTriangle}
              variant="danger"
            />
          ) : (
            <StatCard
              size="hero"
              titulo="Prioridades de hoje"
              valor="0"
              subtitulo="Sem alertas críticos"
              icon={AlertTriangle}
              variant="success"
            />
          )}
        </div>
      </section>

      {/* ─── Painel de decisão — Clientes que exigem ação ─── */}
      <section>
        <SectionHeader
          overline="Ação requerida"
          titulo="Clientes que exigem ação hoje"
          descricao={priorizados.length > 0 ? `${priorizados.length} prioridades ordenadas por severidade` : 'Nenhuma prioridade no momento'}
        />
        <Card className={priorizados.length > 0 ? 'border-seven-danger/30' : ''}>
          <CardContent className="p-0">
            <DataTable data={priorizados} columns={columns} onRowClick={(c) => navigate(`/admin/cliente/${c.id}`)} emptyMessage="Nenhum cliente em situação crítica." />
          </CardContent>
        </Card>
      </section>

      {/* ─── Nível 2: KPIs primários — risco e bloqueios ─── */}
      <section>
        <SectionHeader overline="Saúde contratual e risco" titulo="Sinais de alerta" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard titulo="Em risco" valor={emRisco} icon={AlertTriangle} variant="danger" subtitulo="Clientes com risco alto/crítico" onClick={() => navigate('/admin/clientes')} />
          <StatCard titulo="Bloqueados" valor={clientesBloqueados} icon={ShieldAlert} variant="danger" subtitulo="Pausa ou risco operacional" onClick={() => navigate('/admin/clientes')} />
          <StatCard titulo="Tarefas impedidas" valor={tarefasImpedidas} icon={Clock} variant="warning" subtitulo="Bloqueios ativos" onClick={() => navigate('/admin/tarefas')} />
          <StatCard titulo="Potencial Upsell" valor={upsell.length} icon={DollarSign} variant="success" subtitulo="Oportunidades ativas" onClick={() => navigate('/admin/clientes')} />
        </div>
      </section>

      {/* ─── Alertas operacionais (Seven Gestão) ─── */}
      <section>
        <SectionHeader
          overline="Sinais operacionais"
          titulo="Alertas das clínicas"
          descricao="Sinais agregados do Seven Gestão · clique para abrir o painel"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            size="compact"
            titulo="Crítico"
            valor={alertasCounts.critico}
            subtitulo="Bloqueios operacionais"
            icon={ShieldAlert}
            variant="danger"
            onClick={() => navigate('/admin/alertas?severidade=critico')}
          />
          <StatCard
            size="compact"
            titulo="Atenção"
            valor={alertasCounts.atencao}
            subtitulo="Degradação de uso"
            icon={AlertTriangle}
            variant="warning"
            onClick={() => navigate('/admin/alertas?severidade=atencao')}
          />
          <StatCard
            size="compact"
            titulo="Oportunidade"
            valor={alertasCounts.oportunidade}
            subtitulo="Adoção e upsell"
            icon={Lightbulb}
            variant="info"
            onClick={() => navigate('/admin/alertas?severidade=oportunidade')}
          />
        </div>
      </section>

      {/* ─── Nível 3: KPIs secundários — operação ─── */}
      <section>
        <SectionHeader overline="Operação" titulo="Carteira e produtividade" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard size="compact" titulo="Clientes ativos" valor={ativos} icon={Users} variant="default" onClick={() => navigate('/admin/clientes')} />
          <StatCard size="compact" titulo="Contratos" valor={totalContratos} icon={FileText} variant="default" onClick={() => navigate('/admin/contratos')} />
          <StatCard size="compact" titulo="Reuniões hoje" valor={reunioesHoje} icon={CalendarDays} variant="default" />
          <StatCard size="compact" titulo="Tarefas pendentes" valor={tarefasPendentes} icon={Clock} variant="default" onClick={() => navigate('/admin/tarefas')} />
          <StatCard size="compact" titulo="Renovação" valor={`${taxaRenovacao}%`} icon={TrendingUp} variant="default" onClick={() => navigate('/admin/contratos')} />
          <StatCard size="compact" titulo="LTV médio" valor={ltvFormatado} icon={DollarSign} variant="default" onClick={() => navigate('/admin/contratos')} />
        </div>
      </section>

      {/* ─── Oportunidades de Upsell ─── */}
      {upsell.length > 0 && (
        <section>
          <SectionHeader overline="Expansão comercial" titulo="Oportunidades de upsell" descricao={`${upsell.length} clientes com potencial identificado`} />
          <Card className="border-seven-success/20">
            <CardContent className="p-2">
              {upsell.map(c => (
                <ListRow
                  key={c.id}
                  tone="success"
                  onClick={() => navigate(`/admin/cliente/${c.id}`)}
                  trailing={<StatusTag label="Upsell" variant="success" />}
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-seven-success shrink-0" strokeWidth={1.5} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.nomeFantasia}</p>
                      <p className="text-xs text-muted-foreground">Índice Seven: {c.indiceSeven} · {c.segmento}</p>
                    </div>
                  </div>
                </ListRow>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ─── Produtividade do Time ─── */}
      <section>
        <SectionHeader overline="Time" titulo="Produtividade dos consultores" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {['c1', 'c2', 'c3'].map(cid => {
            const consultor = clientes.filter(c => c.consultorId === cid);
            const nome = consultor[0]?.consultorNome || 'Usuário';
            const numClientes = consultor.length;
            const numTarefas = tarefas.filter(t => t.consultorId === cid && t.status !== 'concluida').length;
            const cap = getCapacidade(cid);
            return (
              <Card key={cid} className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5" onClick={() => navigate(`/admin/consultores/${cid}`)}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{nome}</p>
                    <StatusTag label={labelCapacidade[cap.status]} variant={variantCapacidade[cap.status]} />
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{numClientes} clientes</span>
                    <span>{numTarefas} tarefas</span>
                    <span className="tabular-nums">{cap.ocupacaoPct}% ocup.</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Card Balanceamento da Carteira */}
        <div className="mt-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Balanceamento da Carteira</p>
                    <p className="text-xs text-muted-foreground">Distribuição de clientes entre consultores</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-semibold tabular-nums">{balanceamento.score}<span className="text-xs text-muted-foreground">/100</span></p>
                  </div>
                  <StatusTag label={balanceamento.label} variant={balanceamento.variant} />
                  <Button variant="outline" size="sm" onClick={() => setBalModalOpen(true)}>Ver detalhes</Button>
                </div>
              </div>
              <div className="flex items-end gap-3 h-24 pt-2">
                {balanceamento.distribuicao.map(d => {
                  const max = Math.max(...balanceamento.distribuicao.map(x => x.clientes), 1);
                  const h = Math.max(8, (d.clientes / max) * 100);
                  return (
                    <div key={d.consultor.id} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] tabular-nums text-muted-foreground">{d.clientes}</span>
                      <div className="w-full rounded-sm bg-primary" style={{ height: `${h}%` }} title={`${d.consultor.nome}: ${d.clientes} clientes`} />
                      <span className="text-[10px] text-muted-foreground truncate w-full text-center">{d.consultor.nome.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Dialog open={balModalOpen} onOpenChange={setBalModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Balanceamento — Detalhes</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 ui-overline border-b border-border">
              <span className="col-span-4">Usuário</span>
              <span className="col-span-2 text-right">Clientes</span>
              <span className="col-span-2 text-right">Ocupação</span>
              <span className="col-span-4">Sugestão</span>
            </div>
            {balanceamento.distribuicao.map(d => (
              <div key={d.consultor.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-sm hover:bg-muted/40 rounded-md cursor-pointer" onClick={() => { setBalModalOpen(false); navigate(`/admin/consultores/${d.consultor.id}`); }}>
                <span className="col-span-4 font-medium">{d.consultor.nome}</span>
                <span className="col-span-2 text-right tabular-nums">{d.clientes}</span>
                <span className="col-span-2 text-right tabular-nums">{d.ocupacao}%</span>
                <span className="col-span-4 text-muted-foreground">{d.sugestao}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Atalhos ─── */}
      <section>
        <SectionHeader overline="Atalhos" titulo="Navegação rápida" />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/clientes')}><Users className="h-4 w-4 mr-1" />Clientes e Contratos</Button>
          <Button variant="outline" onClick={() => navigate('/admin/inteligencia')}><BarChart3 className="h-4 w-4 mr-1" />Inteligência de Mercado</Button>
          <Button variant="outline" onClick={() => navigate('/admin/consultores')}><Users className="h-4 w-4 mr-1" />Usuários</Button>
        </div>
      </section>

      {statusModal && (
        <ModalAlterarStatus open={statusModal.open} onClose={() => setStatusModal(null)} clienteNome={statusModal.clienteNome} statusAtual={statusModal.statusAtual} />
      )}
    </div>
  );
}
