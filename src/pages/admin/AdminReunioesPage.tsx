import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, FilterConfig } from '@/components/FilterBar';
import { DataTable, Column } from '@/components/DataTable';
import { StatusTag } from '@/components/StatusTag';
import { useReunioes } from '@/hooks/useReunioes';
import { useClientes } from '@/hooks/useClientes';
import { useConsultores } from '@/hooks/useConsultores';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreVertical, Edit, Trash2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ModalReuniao } from '@/components/modals/ModalReuniao';
import { ModalRegistrarReuniao } from '@/components/modals/ModalRegistrarReuniao';
import { ModalVerDetalhesReuniao } from '@/components/modals/ModalVerDetalhesReuniao';
import type { Reuniao } from '@/types';

export default function AdminReunioesPage() {
  const { reunioes, isLoading: loadingReunioes, deleteReuniao } = useReunioes();
  const { clientes } = useClientes();
  const { consultores } = useConsultores();
  
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReuniao, setSelectedReuniao] = useState<Reuniao | null>(null);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const isLoading = loadingReunioes;

  const filterConfigs: FilterConfig[] = [
    { key: 'status', label: 'Status', options: [
      { label: 'Agendada', value: 'agendada' },
      { label: 'Realizada', value: 'realizada' },
      { label: 'Cancelada', value: 'cancelada' },
    ]},
    { key: 'clienteId', label: 'Cliente', options: (clientes || []).map(c => ({ label: c.nomeFantasia || c.razaoSocial, value: c.id })) },
    { key: 'consultorId', label: 'Usuário', options: (consultores || []).map(c => ({ label: c.full_name, value: c.id })) },
  ];

  const filteredData = (reunioes || []).filter(r => {
    const matchesSearch = (r.title || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filters.status || filters.status === 'todos' || r.status === filters.status;
    const matchesCliente = !filters.clienteId || filters.clienteId === 'todos' || r.clienteId === filters.clienteId;
    const matchesConsultor = !filters.consultorId || filters.consultorId === 'todos' || r.consultorId === filters.consultorId;
    return matchesSearch && matchesStatus && matchesCliente && matchesConsultor;
  });

  const columns: Column<Reuniao>[] = [
    { 
      key: 'pauta', 
      header: 'Reunião', 
      render: (r) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm line-clamp-1">{r.title || 'Sem pauta'}</p>
            {r.meetingLinkProvider === 'teams' && (
              <Badge className="h-4 px-1.5 bg-[#4B53BC] text-white text-[8px] uppercase font-bold">Teams</Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground line-clamp-1">{r.tipo}</p>
        </div>
      )
    },
    { key: 'clienteNome', header: 'Cliente', render: (r) => <span className="text-xs">{r.clienteNome}</span> },
    { key: 'consultorNome', header: 'Responsável', render: (r) => <span className="text-xs">{r.consultorNome}</span> },
    { key: 'meetingDate', header: 'Data/Hora', render: (r) => <span className="text-xs">{new Date(r.meetingDate + 'T00:00:00').toLocaleDateString('pt-BR')} — {r.startTime}</span> },
    { 
      key: 'status', 
      header: 'Status', 
      render: (r) => <StatusTag label={r.status} variant={r.status === 'realizada' ? 'success' : r.status === 'cancelada' ? 'danger' : 'info'} /> 
    },
    {
      key: 'acoes',
      header: '',
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setSelectedReuniao(r); setDetailsModalOpen(true); }}>
              <Clock className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
            {r.status === 'agendada' && (
              <DropdownMenuItem onClick={() => { setSelectedReuniao(r); setRegisterModalOpen(true); }}>
                <Edit className="mr-2 h-4 w-4" />
                Registrar Ata
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => { setSelectedReuniao(r); setModalOpen(true); }}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Agendamento
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => deleteReuniao.mutate(r.id)}>
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
      <PageHeader titulo="Gestão de Reuniões" subtitulo="Agendamento e histórico de reuniões" />
      <FilterBar
        searchValue={search} onSearchChange={setSearch}
        filters={filterConfigs} filterValues={filters}
        onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
      />
      <DataTable data={filteredData} columns={columns} />
      <ModalReuniao open={modalOpen} onClose={() => { setModalOpen(false); setSelectedReuniao(null); }} reuniao={selectedReuniao} />
      {selectedReuniao && (
        <>
          <ModalRegistrarReuniao 
            open={registerModalOpen} 
            onClose={() => setRegisterModalOpen(false)} 
            clienteId={selectedReuniao.clienteId} 
            clienteNome={selectedReuniao.clienteNome} 
          />
          <ModalVerDetalhesReuniao 
            open={detailsModalOpen} 
            onClose={() => setDetailsModalOpen(false)} 
            reuniao={selectedReuniao} 
          />
        </>
      )}
    </div>
  );
}