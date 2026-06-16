import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, FilterConfig, DateRangeValue } from '@/components/FilterBar';
import { DataTable, Column } from '@/components/DataTable';
import { StatusTag } from '@/components/StatusTag';
import { SectionHeader } from '@/components/SectionHeader';
import { Card, CardContent } from '@/components/ui/card';
import { IndiceSevenInfo } from '@/components/IndiceSevenInfo';
import { useAuth } from '@/contexts/AuthContext';
import {
  labelStatus, labelFase,
  labelEngajamento, variantEngajamento, calcularEngajamento, diasDesdeUltimaReuniao,
} from '@/data/mockData';
import { getProdutoAtualCliente, PRODUTOS } from '@/data/contratoExtras';
import { getPorte, labelPorte, PORTE_OPTIONS } from '@/data/clienteExtras';
import { calcularPrioridade, labelPrioridade, variantPrioridade, ordemPrioridade, getClienteContexto } from '@/data/clienteIndicadores';
import { MethodologyStepper } from '@/components/MethodologyStepper';
// Removed ModalNovoCliente import as it's no longer used here
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Target, Loader2, Trash2 } from 'lucide-react';
import { useMyPermissions } from '@/hooks/useConsultantPermissions';
import type { Cliente, FaseMetodologica, Contrato } from '@/types';
import { useClientes } from '@/hooks/useClientes';
import { matchesClienteSearch } from '@/lib/searchClientes';

import { useContratos } from '@/hooks/useContratos';
import { useReunioes } from '@/hooks/useReunioes';
import { useTarefas } from '@/hooks/useTarefas';
import { Skeleton } from '@/components/ui/skeleton';

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();


const STATUS_OPTIONS = [
  { label: 'Ativo', value: 'ativo' },
  { label: 'Em onboarding', value: 'em_onboarding' },
  { label: 'Em renovação', value: 'em_renovacao' },
  { label: 'Renovado', value: 'renovado' },
  { label: 'Bloqueado', value: 'bloqueado' },
  { label: 'Suspenso', value: 'suspenso' },
  { label: 'Cancelado', value: 'cancelado' },
  { label: 'Churn', value: 'churn' },
  { label: 'Encerrado', value: 'encerrado' },
];

const ENGAJAMENTO_OPTIONS = [
  { label: 'Em dia', value: 'em_dia' },
  { label: 'Atenção', value: 'atencao' },
  { label: 'Crítico', value: 'critico' },
];

const PRIORIDADE_OPTIONS = [
  { label: 'Crítica', value: 'critica' },
  { label: 'Alta', value: 'alta' },
  { label: 'Média', value: 'media' },
  { label: 'Baixa', value: 'baixa' },
];

type SortKey = 'prioridade' | 'tempoSemInteracao' | 'alfabetica';

const FASES: FaseMetodologica[] = ['diagnostico', 'planejamento', 'estruturacao', 'monitoramento', 'encerramento'];
const FASE_COLORS = ['#A18261', '#7B6249', '#3D3328', '#C9B59A', '#E5DDD0'];
const PRODUTO_COLORS = ['#A18261', '#7B6249', '#C9B59A', '#3D3328', '#E5DDD0', '#8B7059'];

export default function ConsultorClientesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { clientes, isLoading: loadingClientes, deleteCliente } = useClientes();
  const { contratos, isLoading: loadingContratos } = useContratos();
  const { reunioes, isLoading: loadingReunioes } = useReunioes();
  const { tarefas, isLoading: loadingTarefas } = useTarefas();
  const { can, isLoading: loadingPermissions } = useMyPermissions();
  
  const isLoading = loadingClientes || loadingContratos || loadingReunioes || loadingTarefas || loadingPermissions;
  const meusClientes = clientes || [];

  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);

  

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [dateRangeValue, setDateRangeValue] = useState<DateRangeValue>({});
  const [toggleValues, setToggleValues] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<SortKey>('prioridade');

  const filterConfigs: FilterConfig[] = [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    { key: 'porte', label: 'Porte', options: PORTE_OPTIONS },

    { key: 'engajamento', label: 'Engajamento', options: ENGAJAMENTO_OPTIONS },
    { key: 'prioridade', label: 'Prioridade', options: PRIORIDADE_OPTIONS },
  ];

  // Visualizações da carteira
  const distFases = useMemo(() => FASES.map(f => ({
    name: labelFase[f] || f,
    value: meusClientes.filter(c => c.faseMetodologica === f).length,
  })).filter(d => d.value > 0), [meusClientes]);

  const distProdutos = useMemo(() => {
    return []; // No longer needed
  }, []);



  const data = useMemo(() => {
    let d = [...meusClientes];
    if (search.trim()) d = d.filter(c => matchesClienteSearch(c, search));
    if (filters.status && filters.status !== 'todos') d = d.filter(c => c.status === filters.status);
    if (filters.porte && filters.porte !== 'todos') d = d.filter(c => getPorte(c) === filters.porte);

    if (filters.engajamento && filters.engajamento !== 'todos') d = d.filter(c => calcularEngajamento(c.id, reunioes || []) === filters.engajamento);
    if (filters.prioridade && filters.prioridade !== 'todos') d = d.filter(c => calcularPrioridade(c, contratos || [], tarefas || []).nivel === filters.prioridade);

    if (dateRangeValue.from) d = d.filter(c => new Date(c.dataInicio) >= dateRangeValue.from!);
    if (dateRangeValue.to) d = d.filter(c => new Date(c.dataInicio) <= dateRangeValue.to!);
    if (toggleValues.encerrandoEmBreve) {
      const hoje = new Date();
      const limite = new Date(); limite.setDate(limite.getDate() + 90);
      d = d.filter(c => {
        const ct = (contratos || []).find(ct => ct.clienteId === c.id);
        if (!ct) return false;
        const f = new Date(ct.dataFim);
        return f >= hoje && f <= limite;
      });
    }

    // Ordenação
    if (sortKey === 'prioridade') {
      d.sort((a, b) => ordemPrioridade[calcularPrioridade(a, contratos || [], tarefas || []).nivel] - ordemPrioridade[calcularPrioridade(b, contratos || [], tarefas || []).nivel]);
    } else if (sortKey === 'tempoSemInteracao') {
      d.sort((a, b) => (diasDesdeUltimaReuniao(b.id, reunioes || []) || 0) - (diasDesdeUltimaReuniao(a.id, reunioes || []) || 0));

    } else {
      d.sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia));
    }
    return d;
  }, [search, filters, dateRangeValue, toggleValues, meusClientes, sortKey]);

  const columns: Column<Cliente>[] = [
    { key: 'nome', header: 'Cliente', render: (c) => {
      const ctx = getClienteContexto(c);
      const briefingFull = ctx.briefing?.trim() || '';
      const objetivoShort = (ctx.objetivoAtual || '').length > 80
        ? (ctx.objetivoAtual || '').slice(0, 80) + '…'
        : (ctx.objetivoAtual || '');
      const doresTop = ctx.dores.slice(0, 3);
      const doresRestantes = Math.max(0, ctx.dores.length - 3);
      const fatoresTop = ctx.fatoresSucesso.slice(0, 3);
      const fatoresRestantes = Math.max(0, ctx.fatoresSucesso.length - 3);
      return (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt={c.nomeFantasia} className="h-full w-full object-cover" />
                  ) : (
                    (c.nomeFantasia || 'C').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.nomeFantasia}</p>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[260px]">
                    {objetivoShort || 'Não informado'}
                  </p>
                </div>
              </div>
            </TooltipTrigger>

            <TooltipContent
              side="right"
              className="text-xs space-y-2 w-[min(520px,calc(100vw-32px))] max-w-[min(520px,calc(100vw-32px))]"
            >
              <div>
                <p className="ui-overline">Briefing</p>
                <p className="whitespace-pre-wrap [word-break:break-word] [overflow-wrap:anywhere]">
                  {briefingFull || 'Não informado'}
                </p>
              </div>
              <div>
                <p className="ui-overline">Principais dores</p>
                {doresTop.length > 0 ? (
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    {doresTop.map(d => <li key={d} className="break-words">{d}</li>)}
                    {doresRestantes > 0 && <li className="list-none italic">+ {doresRestantes} {doresRestantes === 1 ? 'item' : 'itens'}</li>}
                  </ul>
                ) : <p className="text-muted-foreground italic">Nenhuma dor cadastrada</p>}
              </div>
              <div>
                <p className="ui-overline">Fatores de sucesso</p>
                {fatoresTop.length > 0 ? (
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    {fatoresTop.map(f => <li key={f} className="break-words">{f}</li>)}
                    {fatoresRestantes > 0 && <li className="list-none italic">+ {fatoresRestantes} {fatoresRestantes === 1 ? 'item' : 'itens'}</li>}
                  </ul>
                ) : <p className="text-muted-foreground italic">Nenhum fator cadastrado</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }},

    { key: 'prioridade', header: 'Prioridade', render: (c) => {
      const p = calcularPrioridade(c, contratos || [], tarefas || []);

      return (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <StatusTag label={labelPrioridade[p.nivel]} variant={variantPrioridade[p.nivel]} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[260px]">
              <p className="font-medium mb-1">Score: {p.score}</p>
              {p.fatores.length > 0 ? (
                <ul className="list-disc list-inside text-muted-foreground">
                  {p.fatores.map(f => <li key={f}>{f}</li>)}
                </ul>
              ) : <p className="text-muted-foreground">Sem alertas no momento</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }, className: 'w-[110px]' },
    { key: 'porte', header: 'Porte', render: (c) => <span className="text-xs text-muted-foreground">{labelPorte[getPorte(c)]}</span>, className: 'w-[90px]' },
    { key: 'status', header: 'Status', render: (c) => <StatusTag label={labelStatus[c.status]} />, className: 'w-[130px]' },
    { key: 'engajamento', header: 'Engajamento', render: (c) => { const e = calcularEngajamento(c.id, reunioes || []); return <StatusTag label={labelEngajamento[e]} variant={variantEngajamento[e]} />; }, className: 'w-[120px]' },
    { key: 'indice', header: <span className="inline-flex items-center gap-1">Índice <IndiceSevenInfo /></span>, render: (c) => <span className="font-mono">{c.indiceSeven || '—'}</span> },
    { 
      key: 'acoes', 
      header: 'Ações', 
      render: (c) => (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive hover:bg-destructive/10" 
          onClick={(e) => { e.stopPropagation(); setClienteToDelete(c); }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
      className: 'w-[60px]'
    },
  ];


  if (isLoading) {
    return (
      <div className="space-y-8 p-8">
        <Skeleton className="h-12 w-[300px]" />
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!can('clientes')) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Você não tem permissão para acessar este módulo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <PageHeader titulo="Meus Clientes" subtitulo="Carteira de clientes sob sua gestão">
        {can('clientes', 'create') && (
          <Button size="sm" onClick={() => navigate('/consultor/cliente/novo')}>
            <Plus className="h-4 w-4 mr-1" />Novo Cliente
          </Button>
        )}
      </PageHeader>



      {/* Ordenação e filtros */}
      <div className="space-y-3">
        <FilterBar
          searchValue={search} onSearchChange={setSearch}
          searchPlaceholder="Buscar por nome fantasia, razão social, CNPJ ou responsável..."
          filters={filterConfigs} filterValues={filters}
          onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
          dateRange={{ key: 'dataInicio', label: 'Início' }}
          dateRangeValue={dateRangeValue}
          onDateRangeChange={setDateRangeValue}
          toggles={[{ key: 'encerrandoEmBreve', label: 'Encerrando em 90 dias' }]}
          toggleValues={toggleValues}
          onToggleChange={(k, v) => setToggleValues(prev => ({ ...prev, [k]: v }))}
          onClear={() => { setSearch(''); setFilters({}); setDateRangeValue({}); setToggleValues({}); }}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="ui-overline mr-1">Ordenar por</span>
          {([
            { k: 'prioridade', l: 'Prioridade' },
            { k: 'tempoSemInteracao', l: 'Tempo sem interação' },
            { k: 'alfabetica', l: 'A → Z' },
          ] as { k: SortKey; l: string }[]).map(opt => (
            <Button
              key={opt.k}
              size="sm"
              variant={sortKey === opt.k ? 'default' : 'outline'}
              onClick={() => setSortKey(opt.k)}
              className="h-7 text-xs"
            >
              {opt.l}
            </Button>
          ))}
        </div>
      </div>
      <DataTable data={data} columns={columns} onRowClick={(c) => navigate(`/consultor/cliente/${c.id}`)} emptyMessage="Nenhum cliente encontrado para essa busca. Revise o termo digitado ou limpe os filtros aplicados." />
      
      <AlertDialog open={!!clienteToDelete} onOpenChange={(open) => !open && setClienteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>"{clienteToDelete?.nomeFantasia || clienteToDelete?.razaoSocial}"</strong>?
              <br /><br />
              Essa ação removerá o cliente da sua carteira e poderá afetar contratos, reuniões, documentos e registros vinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if (clienteToDelete) {
                  try {
                    await deleteCliente.mutateAsync(clienteToDelete.id);
                    setClienteToDelete(null);
                  } catch (error) {
                    console.error("Erro ao excluir:", error);
                  }
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

