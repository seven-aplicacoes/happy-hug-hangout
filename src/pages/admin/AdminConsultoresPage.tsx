import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, FilterConfig } from '@/components/FilterBar';
import { DataTable, Column } from '@/components/DataTable';
import { StatusTag } from '@/components/StatusTag';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { labelEspecialidade } from '@/data/mockData';
import { getRepassesConsultor } from '@/data/sevenGestaoMock';
import { calculateCapacidade, labelCapacidade, variantCapacidade, getAlertaCapacidadeFromData } from '@/data/consultorExtras';
import { useContratos } from '@/hooks/useContratos';
import { StatCard } from '@/components/StatCard';
import { Activity, AlertTriangle, Gauge, Plus, UserPlus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Users } from 'lucide-react';
import type { Cliente, Reuniao, Tarefa } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useConsultores, ConsultantProfile } from '@/hooks/useConsultores';
import { ConsultorModal } from '@/components/modals/ConsultorModal';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import { useClientes } from '@/hooks/useClientes';
import { useReunioes } from '@/hooks/useReunioes';
import { useTarefas } from '@/hooks/useTarefas';
import { Skeleton } from '@/components/ui/skeleton';


interface ConsultorRow {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  especialidade: string;
  cidade: string;
  estado: string;
  status: string;
  consultingArea: string;
  userCategory: string;
  clientesAtivos: number;
  clientesEmRisco: number;
  clientesBloqueados: number;
  reunioesRealizadas: number;
  tarefasEmAtraso: number;
  repasseMes: number;
  taxaExecucao: number;
  atencao: boolean;
}

const hoje = new Date().toISOString().slice(0, 10);

function buildRows(
  consultoresList: ConsultantProfile[], 
  clientes: Cliente[], 
  reunioes: Reuniao[], 
  tarefas: Tarefa[],
  contratos: any[]
): ConsultorRow[] {
  return consultoresList.map(c => {
    const mc = (clientes || []).filter(cl => cl.consultorId === c.id);
    const mr = (reunioes || []).filter(r => r.consultorId === c.id);
    const mt = (tarefas || []).filter(t => t.consultorId === c.id);
    const mContratos = (contratos || []).filter(con => con.consultorId === c.id);
    
    const repasseMes = mContratos.reduce((sum, con) => sum + (con.valor || 0), 0) * 0.3; // Exemplo: 30% do valor total dos contratos
    const totalReunioes = mr.length;
    const reunioesRealizadas = mr.filter(r => r.status === 'realizada').length;
    const taxaExecucao = totalReunioes > 0 ? Math.round((reunioesRealizadas / totalReunioes) * 100) : 0;

    const clientesEmRisco = mc.filter(cl => cl.status === 'bloqueado' || cl.status === 'suspenso').length;
    const clientesBloqueados = mc.filter(cl => cl.status === 'cancelado' || cl.status === 'churn' || cl.status === 'encerrado').length;
    const tarefasEmAtraso = mt.filter(t => t.dataVencimento < hoje && t.status !== 'concluida').length;
    
    return {
      id: c.id,
      nome: c.full_name || 'Sem nome',
      email: c.email,
      cargo: c.role === 'admin' ? 'Administrador' : 'Usuário',
      especialidade: c.specialty || 'geral',
      cidade: c.city || '—',
      estado: c.state || '—',
      status: c.status || 'ativo',
      consultingArea: (c as any).consulting_area || '',
      userCategory: (c as any).user_category || '',
      clientesAtivos: mc.filter(cl => cl.status === 'ativo').length,
      clientesEmRisco,
      clientesBloqueados,
      reunioesRealizadas,
      tarefasEmAtraso,
      repasseMes,
      taxaExecucao,
      atencao: clientesEmRisco > 0 || tarefasEmAtraso > 0 || clientesBloqueados > 0,
    };
  });
}


const especialidades: { label: string; value: string }[] = [
  { label: 'Gestão', value: 'gestao' },
  { label: 'Financeiro', value: 'financeiro' },
  { label: 'Comercial', value: 'comercial' },
  { label: 'Processos', value: 'processos' },
  { label: 'Pessoas', value: 'pessoas' },
  { label: 'Estratégia', value: 'estrategia' },
];

const filters: FilterConfig[] = [
  { key: 'status', label: 'Status', options: [{ label: 'Ativo', value: 'ativo' }, { label: 'Inativo', value: 'inativo' }] },
  { key: 'especialidade', label: 'Área', options: especialidades },
  { key: 'atencao', label: 'Atenção', options: [
    { label: 'Clientes em risco', value: 'risco' },
    { label: 'Tarefas em atraso', value: 'atraso' },
    { label: 'Clientes bloqueados', value: 'bloqueados' },
  ]},
];

type SortKey = 'nome' | 'clientesAtivos' | 'clientesEmRisco' | 'reunioesRealizadas' | 'tarefasEmAtraso' | 'repasseMes' | 'taxaExecucao';

export default function AdminConsultoresPage() {
  const navigate = useNavigate();
  const { consultores, isLoading: loadingConsultores, createConsultant, updateConsultant, deleteConsultant, isProcessing } = useConsultores();
  const { clientes, isLoading: loadingClientes } = useClientes();
  const { reunioes, isLoading: loadingReunioes } = useReunioes();
  const { tarefas, isLoading: loadingTarefas } = useTarefas();
  const { contratos, isLoading: loadingContratos } = useContratos();

  const isLoading = loadingConsultores || loadingClientes || loadingReunioes || loadingTarefas || loadingContratos;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<ConsultantProfile | null>(null);
  const [consultantToDelete, setConsultantToDelete] = useState<string | null>(null);

  const allRows = useMemo(() => {
    if (isLoading || !consultores) return [];
    return buildRows(consultores, clientes || [], reunioes || [], tarefas || [], contratos || []);
  }, [consultores, clientes, reunioes, tarefas, contratos, isLoading]);

  const [search, setSearch] = useState('');

  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<SortKey>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let rows = allRows;
    const q = search.toLowerCase();
    if (q) {
      rows = rows.filter(r =>
        r.nome.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        labelEspecialidade[r.especialidade]?.toLowerCase().includes(q)
      );
    }
    if (filterValues.status && filterValues.status !== 'todos') {
      rows = rows.filter(r => r.status === filterValues.status);
    }
    if (filterValues.especialidade && filterValues.especialidade !== 'todos') {
      rows = rows.filter(r => r.especialidade === filterValues.especialidade);
    }
    if (filterValues.atencao && filterValues.atencao !== 'todos') {
      if (filterValues.atencao === 'risco') rows = rows.filter(r => r.clientesEmRisco > 0);
      if (filterValues.atencao === 'atraso') rows = rows.filter(r => r.tarefasEmAtraso > 0);
      if (filterValues.atencao === 'bloqueados') rows = rows.filter(r => r.clientesBloqueados > 0);
    }
    // Sort
    rows = [...rows].sort((a, b) => {
      if (sortKey === 'nome') return sortDir === 'asc' ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome);
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return rows;
  }, [allRows, search, filterValues, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'nome' ? 'asc' : 'desc');
    }
  };

  const sortIndicator = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const columns: Column<ConsultorRow>[] = [
    {
      key: 'nome',
      header: `Usuário${sortIndicator('nome')}`,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            {c.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{c.nome}</p>
            <p className="text-xs text-muted-foreground">{c.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'cargo', header: 'Cargo', render: (c) => <span className="text-sm">{c.cargo}</span> },
    { key: 'especialidade', header: 'Área', render: (c) => <span className="text-sm">{labelEspecialidade[c.especialidade]}</span> },
    {
      key: 'clientesAtivos',
      header: `Clientes${sortIndicator('clientesAtivos')}`,
      render: (c) => <span className="text-sm font-medium">{c.clientesAtivos}</span>,
    },
    {
      key: 'clientesEmRisco',
      header: `Em Risco${sortIndicator('clientesEmRisco')}`,
      render: (c) => c.clientesEmRisco > 0
        ? <StatusTag label={`${c.clientesEmRisco}`} variant="danger" />
        : <span className="text-sm text-muted-foreground">0</span>,
    },
    {
      key: 'reunioesRealizadas',
      header: `Reuniões${sortIndicator('reunioesRealizadas')}`,
      render: (c) => <span className="text-sm">{c.reunioesRealizadas}</span>,
    },
    {
      key: 'tarefasEmAtraso',
      header: `Em Atraso${sortIndicator('tarefasEmAtraso')}`,
      render: (c) => c.tarefasEmAtraso > 0
        ? <StatusTag label={`${c.tarefasEmAtraso}`} variant="warning" />
        : <span className="text-sm text-muted-foreground">0</span>,
    },
    {
      key: 'repasseMes',
      header: `Repasse mês${sortIndicator('repasseMes')}`,
      render: (c) => <span className="text-sm tabular-nums font-medium">R$ {c.repasseMes.toLocaleString('pt-BR')}</span>,
      className: 'text-right',
    },
    {
      key: 'taxaExecucao',
      header: `Taxa exec.${sortIndicator('taxaExecucao')}`,
      render: (c) => {
        const v = c.taxaExecucao;
        const variant = v >= 90 ? 'success' : v >= 75 ? 'warning' : 'danger';
        return <StatusTag label={`${v}%`} variant={variant} />;
      },
    },
    {
      key: 'capacidade',
      header: 'Capacidade',
      render: (c) => {
        const consultorData = consultores?.find(con => con.id === c.id);
        const cap = calculateCapacidade(
          c.id, 
          { hours_available: consultorData?.hours_available, max_clients: consultorData?.max_clients }, 
          clientes || [], 
          reunioes || [], 
          contratos || []
        );
        return (
          <div className="flex flex-col gap-1">
            <StatusTag label={labelCapacidade[cap.status]} variant={variantCapacidade[cap.status]} />
            <span className="text-[10px] text-muted-foreground tabular-nums">{cap.ocupacaoPct}% · {cap.clientesAtivos}/{cap.maxClientes}</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <StatusTag label={c.status === 'ativo' ? 'Ativo' : 'Inativo'} variant={c.status === 'ativo' ? 'success' : 'neutral'} />,
    },
    {
      key: 'acoes' as any,
      header: '',
      render: (c) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                const profile = consultores?.find(p => p.id === c.id);
                if (profile) {
                  setSelectedConsultant(profile);
                  setIsModalOpen(true);
                }
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => setConsultantToDelete(c.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];


  const todasCapacidades = useMemo(() => {
    if (!consultores) return [];
    return consultores.map(c => calculateCapacidade(
      c.id, 
      { hours_available: c.hours_available, max_clients: c.max_clients }, 
      clientes || [], 
      reunioes || [], 
      contratos || []
    ));
  }, [consultores, clientes, reunioes, contratos]);

  // Bubble chart data
  const bubbleData = useMemo(() => {
    return todasCapacidades.map(cap => {
      const c = consultores?.find(co => co.id === cap.consultorId);
      if (!c) return null;
      const fill =
        cap.status === 'sobrecarga' ? 'hsl(var(--seven-danger))' :
        cap.status === 'atencao' ? 'hsl(var(--seven-warning))' :
        cap.status === 'disponivel' ? 'hsl(var(--seven-success))' :
        'hsl(var(--primary))';
      return {
        x: cap.clientesAtivos,
        y: cap.ocupacaoPct,
        z: Math.max(50, Math.round(cap.ltvMedioCarteira / 100)),
        nome: c.full_name || 'Sem nome',
        ltv: cap.ltvMedioCarteira,
        max: cap.maxClientes,
        fill,
        id: c.id,
      };
    }).filter(Boolean) as any[];
  }, [todasCapacidades, consultores]);

  const balanceamento = useMemo(() => {
    const dist = todasCapacidades.map(cap => {
      const c = consultores?.find(co => co.id === cap.consultorId);
      let sugestao = 'Manter';
      if (cap.status === 'sobrecarga') sugestao = 'Realocar clientes para outro consultor';
      else if (cap.status === 'subutilizacao') sugestao = 'Receber novos clientes';
      return { consultor: c as ConsultantProfile, clientes: cap.clientesAtivos, ocupacao: cap.ocupacaoPct, sugestao };
    });
    const valores = dist.map(d => d.clientes);
    const media = valores.reduce((s, v) => s + v, 0) / Math.max(1, valores.length);
    const desvio = Math.sqrt(valores.reduce((s, v) => s + (v - media) ** 2, 0) / Math.max(1, valores.length));
    const score = Math.max(0, Math.min(100, Math.round(100 - (desvio / Math.max(1, media)) * 100)));
    const label: 'Balanceado' | 'Atenção' | 'Desbalanceado' = score > 80 ? 'Balanceado' : score >= 60 ? 'Atenção' : 'Desbalanceado';
    const variant: 'success' | 'warning' | 'danger' = score > 80 ? 'success' : score >= 60 ? 'warning' : 'danger';
    return { score, label, variant, distribuicao: dist };
  }, [todasCapacidades, consultores]);

  const maxClientesGlobal = useMemo(() => Math.max(...bubbleData.map(b => b.max), 1), [bubbleData]);

  const handleSaveConsultant = async (userData: any) => {
    if (selectedConsultant) {
      await updateConsultant({ ...userData, id: selectedConsultant.id });
    } else {
      await createConsultant(userData);
    }
  };



  return (
    <div className="space-y-6">
      <PageHeader titulo="Usuários" subtitulo="Gestão de usuários e suas carteiras">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{allRows.length} usuários</span>
          </div>
          <Button onClick={() => { setSelectedConsultant(null); setIsModalOpen(true); }} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </div>
      </PageHeader>


      <Tabs defaultValue="lista" className="w-full">
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="capacidade">Capacidade</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4 mt-4">
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por nome, e-mail ou área..."
            filters={filters}
            filterValues={filterValues}
            onFilterChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
          />

          <div className="flex flex-wrap gap-2 text-xs">
            {(['nome', 'clientesAtivos', 'clientesEmRisco', 'reunioesRealizadas', 'tarefasEmAtraso', 'repasseMes', 'taxaExecucao'] as SortKey[]).map(k => (
              <button
                key={k}
                onClick={() => handleSort(k)}
                className={`px-2.5 py-1 rounded-md border transition-colors ${sortKey === k ? 'bg-primary/10 border-primary/30 text-primary font-medium' : 'border-border text-muted-foreground hover:bg-muted'}`}
              >
                {{ nome: 'Nome', clientesAtivos: 'Clientes', clientesEmRisco: 'Risco', reunioesRealizadas: 'Reuniões', tarefasEmAtraso: 'Atraso', repasseMes: 'Repasse', taxaExecucao: 'Taxa exec.' }[k]}
                {sortKey === k && (sortDir === 'asc' ? ' ↑' : ' ↓')}
              </button>
            ))}
          </div>

          <DataTable
            data={filtered}
            columns={columns}
            pageSize={10}
            onRowClick={(c) => navigate(`/admin/consultores/${c.id}`)}
            emptyMessage={isLoading ? "Carregando usuários..." : "Nenhum usuário encontrado no banco de dados."}
          />
        </TabsContent>

        <ConsultorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveConsultant}
          consultor={selectedConsultant}
          isProcessing={isProcessing}
          modo="admin"
        />

        <AlertDialog open={!!consultantToDelete} onOpenChange={() => setConsultantToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este consultor? Esta ação removerá o acesso dele à plataforma e não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={async () => {
                  if (consultantToDelete) {
                    await deleteConsultant(consultantToDelete);
                    setConsultantToDelete(null);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>



        <TabsContent value="capacidade" className="space-y-4 mt-4">
          {(() => {
            if (!consultores) return null;
            const caps = todasCapacidades;
            const capacidadeTotal = caps.reduce((s, c) => s + c.horasDisponiveis, 0);
            const utilizada = caps.reduce((s, c) => s + c.horasUtilizadasMes, 0);
            const ocupGlobal = capacidadeTotal ? Math.round((utilizada / capacidadeTotal) * 100) : 0;
            const sobrecarga = caps.filter(c => c.status === 'sobrecarga').length;
            const bal = balanceamento;
            const alertas = todasCapacidades
              .map(cap => ({ consultor: consultores.find(con => con.id === cap.consultorId), alerta: getAlertaCapacidadeFromData(cap) }))
              .filter(x => x.alerta);

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard titulo="Capacidade total" valor={`${capacidadeTotal}h`} subtitulo="Soma agregada (50–150h por consultor)" icon={Gauge} />
                  <StatCard titulo="Horas utilizadas" valor={`${utilizada}h`} subtitulo="Mês corrente" icon={Activity} />
                  <StatCard titulo="% Ocupação" valor={`${ocupGlobal}%`} variant={ocupGlobal > 90 ? 'danger' : ocupGlobal >= 71 ? 'warning' : 'success'} icon={Activity} />
                  <StatCard titulo="Em sobrecarga" valor={sobrecarga} variant={sobrecarga > 0 ? 'danger' : 'success'} subtitulo={`Balanceamento ${bal.label.toLowerCase()}`} icon={AlertTriangle} />
                </div>

                {alertas.length > 0 && (
                  <Card>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-seven-warning" strokeWidth={1.8} />
                        <h3 className="text-sm font-semibold">Alertas inteligentes de capacidade</h3>
                      </div>
                      <div className="space-y-2">
                        {alertas.map(a => (
                          <div key={a.consultor?.id} className="flex items-start justify-between gap-3 p-3 rounded-md border border-border/60 bg-muted/20">
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{a.consultor?.full_name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                <span className="font-medium text-foreground">Motivo:</span> {a.alerta!.mensagem}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                <span className="font-medium text-foreground">Ação:</span>{' '}
                                {a.alerta!.tipo === 'sobrecarga' ? 'Realocar clientes para colega com capacidade disponível.'
                                  : a.alerta!.tipo === 'subutilizacao' ? 'Atribuir novos clientes ou prospects.'
                                  : 'Manter monitoramento ativo.'}
                              </p>
                            </div>
                            <StatusTag label={a.alerta!.label} variant={a.alerta!.variant} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="p-5 space-y-2">
                    <h3 className="text-sm font-semibold">Balanceamento da carteira</h3>
                    <p className="text-xs text-muted-foreground">Score: <span className="tabular-nums text-foreground font-medium">{bal.score}/100</span> — {bal.label}.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                      {bal.distribuicao.map(d => (
                        <div key={d.consultor?.id} className="text-xs p-3 rounded-md border border-border/60">
                          <p className="font-medium">{d.consultor?.full_name}</p>
                          <p className="text-muted-foreground tabular-nums">{d.clientes} clientes · {d.ocupacao}% ocup.</p>
                          <p className="text-[11px] text-muted-foreground mt-1 italic">{d.sugestao}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            );
          })()}

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Capacidade × Utilização</h3>
                  <p className="text-xs text-muted-foreground">Eixo X: clientes ativos · Eixo Y: % ocupação · Tamanho: LTV médio · Cor: status</p>
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-seven-success" /> Disponível</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-seven-warning" /> Atenção</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-seven-danger" /> Sobrecarga</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Subutilização</span>
                </div>
              </div>
              <div className="h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Clientes ativos"
                      label={{ value: 'Clientes ativos', position: 'bottom', offset: 0, fontSize: 11 }}
                      tick={{ fontSize: 11 }}
                      domain={[0, Math.ceil(maxClientesGlobal * 1.3)]}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Ocupação %"
                      label={{ value: '% Ocupação', angle: -90, position: 'insideLeft', fontSize: 11 }}
                      tick={{ fontSize: 11 }}
                      domain={[0, 120]}
                    />
                    <ZAxis type="number" dataKey="z" range={[120, 800]} name="LTV" />
                    <ReferenceLine x={maxClientesGlobal} stroke="hsl(var(--seven-warning))" strokeDasharray="4 4" label={{ value: 'Capac. máx.', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <ReferenceLine y={90} stroke="hsl(var(--seven-danger))" strokeDasharray="4 4" label={{ value: '90% alerta', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-md border border-border bg-card p-3 shadow-md text-xs space-y-1">
                            <p className="font-semibold text-foreground">{d.nome}</p>
                            <p>Clientes: <span className="tabular-nums">{d.x} / {d.max}</span></p>
                            <p>Ocupação: <span className="tabular-nums">{d.y}%</span></p>
                            <p>LTV médio: <span className="tabular-nums">R$ {d.ltv.toLocaleString('pt-BR')}</span></p>
                          </div>
                        );
                      }}
                    />
                    <Scatter data={bubbleData} onClick={(d: any) => navigate(`/admin/consultores/${d.id}`)} cursor="pointer">
                      {bubbleData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} fillOpacity={0.7} stroke={entry.fill} strokeWidth={1.5} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
