import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, FilterConfig } from '@/components/FilterBar';
import { DataTable, Column } from '@/components/DataTable';
import { StatusTag } from '@/components/StatusTag';
import { useTarefas } from '@/hooks/useTarefas';
import { useClientes } from '@/hooks/useClientes';
import { useConsultores } from '@/hooks/useConsultores';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, MoreVertical, Edit, Trash2, LayoutGrid, List as ListIcon } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { TaskCard } from '@/components/TaskCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ModalDetalhesTarefa } from '@/components/modals/ModalDetalhesTarefa';
import { ModalNovaTarefaChamado } from '@/components/modals/ModalNovaTarefaChamado';
import { ModalRegistrarImpedimento } from '@/components/modals/ModalRegistrarImpedimento';
import type { Tarefa, StatusTarefa } from '@/types';
import { TASK_STATUS_CONFIG, TASK_STATUS_OPTIONS, getTaskStatusLabel, getTaskStatusVariant } from '@/constants/taskStatus';

const colunasKanban = Object.values(TASK_STATUS_CONFIG);

export default function AdminTarefasPage() {
  const { tarefas, isLoading: loadingTarefas, deleteTarefa, upsertTarefa } = useTarefas();
  const { clientes } = useClientes();
  const { consultores } = useConsultores();
  
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [impedimentModalOpen, setImpedimentModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: string, status: StatusTarefa } | null>(null);

  const isLoading = loadingTarefas;

  const filterConfigs: FilterConfig[] = [
    { key: 'status', label: 'Status', options: [
      ...TASK_STATUS_OPTIONS.map(s => ({ label: s.label, value: s.value }))
    ]},
    { key: 'clienteId', label: 'Cliente', options: (clientes || []).map(c => ({ label: c.nomeFantasia || c.razaoSocial, value: c.id })) },
    { key: 'consultorId', label: 'Consultor', options: (consultores || []).map(c => ({ label: c.full_name, value: c.id })) },
  ];

  const filteredData = (tarefas || []).filter(t => {
    const matchesSearch = t.titulo.toLowerCase().includes(search.toLowerCase()) || 
                          t.clienteNome.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filters.status || filters.status === 'todos' || t.status === filters.status;
    const matchesCliente = !filters.clienteId || filters.clienteId === 'todos' || t.clienteId === filters.clienteId;
    const matchesConsultor = !filters.consultorId || filters.consultorId === 'todos' || t.consultorId === filters.consultorId;
    return matchesSearch && matchesStatus && matchesCliente && matchesConsultor;
  });

  const handleStatusChange = async (tarefaId: string, novoStatus: StatusTarefa, motive?: string) => {
    const tarefa = tarefas?.find(t => t.id === tarefaId);
    if (!tarefa) return;

    if (novoStatus === 'impedida' && !motive) {
      setPendingStatusChange({ id: tarefaId, status: novoStatus });
      setImpedimentModalOpen(true);
      return;
    }

    const payload: any = { ...tarefa, status: novoStatus };
    if (motive && novoStatus === 'impedida') {
      payload.novoImpedimento = { reason: motive };
    }
    await upsertTarefa.mutateAsync(payload);
  };

  const handleConfirmImpediment = async (reason: string) => {
    if (pendingStatusChange) {
      await handleStatusChange(pendingStatusChange.id, pendingStatusChange.status, reason);
      setImpedimentModalOpen(false);
      setPendingStatusChange(null);
    }
  };

  const columns: Column<Tarefa>[] = [
    { 
      key: 'titulo', 
      header: 'Tarefa', 
      render: (t) => (
        <div>
          <p className="font-medium text-sm">{t.titulo}</p>
          <p className="text-[11px] text-muted-foreground line-clamp-1">{t.descricao}</p>
        </div>
      )
    },
    { key: 'clienteNome', header: 'Cliente', render: (t) => <span className="text-xs">{t.clienteNome}</span> },
    { key: 'consultorNome', header: 'Responsável', render: (t) => <span className="text-xs">{t.consultorNome}</span> },
    { key: 'dataVencimento', header: 'Vencimento', render: (t) => <span className="text-xs">{new Date(t.dataVencimento).toLocaleDateString('pt-BR')}</span> },
    { 
      key: 'status', 
      header: 'Status', 
      render: (t) => <StatusTag label={getTaskStatusLabel(t.status)} variant={getTaskStatusVariant(t.status)} /> 
    },
    {
      key: 'acoes',
      header: '',
      render: (t) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setSelectedTarefa(t); setModalOpen(true); }}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => deleteTarefa.mutate(t.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-[50px]'
    }
  ];

  if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader titulo="Gestão de Tarefas" subtitulo="Acompanhamento de atividades e prazos">
        <div className="flex gap-2">
          <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="h-9">
            <TabsList className="h-9">
              <TabsTrigger value="kanban" className="h-7 px-3"><LayoutGrid className="h-4 w-4 mr-2" />Kanban</TabsTrigger>
              <TabsTrigger value="list" className="h-7 px-3"><ListIcon className="h-4 w-4 mr-2" />Lista</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => { setCreateModalOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>
      </PageHeader>

      <FilterBar
        searchValue={search} onSearchChange={setSearch}
        filters={filterConfigs} filterValues={filters}
        onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
      />

      {viewMode === 'list' ? (
        <DataTable data={filteredData} columns={columns} />
      ) : (
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
          <div className="flex flex-nowrap gap-4 min-w-max pr-4">
            {colunasKanban.map(col => {
              const items = filteredData.filter(t => t.status === col.value);
              return (
                <div
                  key={col.value}
                  className={`rounded-md border border-t-4 ${col.color} bg-card p-3 min-h-[600px] w-[300px] flex flex-col shrink-0`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggingId) {
                      handleStatusChange(draggingId, col.value);
                      setDraggingId(null);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">{col.label}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
                  </div>
                  <div className="space-y-3 flex-1">
                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 italic text-center py-10">Sem tarefas</p>
                    ) : items.map(t => (
                      <TaskCard
                        key={t.id}
                        tarefa={t}
                        draggable
                        onDelete={(id) => deleteTarefa.mutate(id)}
                        onDragStart={() => setDraggingId(t.id)}
                        onClick={() => { setSelectedTarefa(t); setModalOpen(true); }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ModalDetalhesTarefa open={modalOpen} onClose={() => { setModalOpen(false); setSelectedTarefa(null); }} tarefa={selectedTarefa} />
      <ModalNovaTarefaChamado open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
      <ModalRegistrarImpedimento 
        open={impedimentModalOpen} 
        onClose={() => {
          setImpedimentModalOpen(false);
          setPendingStatusChange(null);
        }}
        onConfirm={handleConfirmImpediment}
        isSubmitting={upsertTarefa.isPending}
      />
    </div>
  );
}