import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, FilterConfig } from '@/components/FilterBar';
import { DataTable, Column } from '@/components/DataTable';
import { StatusTag } from '@/components/StatusTag';
import { useClientes } from '@/hooks/useClientes';
import { matchesClienteSearch } from '@/lib/searchClientes';
import { useConsultores } from '@/hooks/useConsultores';
import { useMyPermissions } from '@/hooks/useConsultantPermissions';
import { ModalNovoCliente } from '@/components/modals/ModalNovoCliente';
import { ModalAcessoPortal } from '@/components/modals/ModalAcessoPortal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Loader2, MoreVertical, Edit, Trash2, Key } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
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
import type { Cliente } from '@/types';

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

const PORTE_OPTIONS = [
  { label: 'MEI', value: 'MEI' },
  { label: 'Micro', value: 'Micro' },
  { label: 'Pequena', value: 'Pequena' },
  { label: 'Média', value: 'Média' },
  { label: 'Grande', value: 'Grande' },
];

export default function AdminClientesPage() {
  const navigate = useNavigate();
  const { clientes, isLoading: loadingClientes, deleteCliente } = useClientes();
  const { consultores: allConsultores, isLoading: loadingConsultores } = useConsultores();
  const consultores = allConsultores?.filter(c => c.role === 'consultor');
  const { can, isLoading: loadingPermissions } = useMyPermissions();
  
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const [clientePortal, setClientePortal] = useState<Cliente | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const isLoading = loadingClientes || loadingConsultores || loadingPermissions;

  const filterConfigs: FilterConfig[] = useMemo(() => [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    { key: 'porte', label: 'Porte', options: PORTE_OPTIONS },
    { 
      key: 'consultorId', 
      label: 'Usuário', 
      options: consultores?.map(c => ({ label: c.full_name || 'Sem nome', value: c.id })) || [] 
    },
  ], [consultores]);

  const data = useMemo(() => {
    if (!clientes) return [];
    let d = [...clientes];
    if (search.trim()) {
      d = d.filter(c => matchesClienteSearch(c, search));
    }
    
    if (filters.status && filters.status !== 'todos') {
      d = d.filter(c => c.status === filters.status);
    }

    if (filters.porte && filters.porte !== 'todos') {
      d = d.filter(c => c.porte === filters.porte);
    }
    
    if (filters.consultorId && filters.consultorId !== 'todos') {
      d = d.filter(c => c.consultorId === filters.consultorId);
    }

    return d;
  }, [search, filters, clientes]);

  const handleDelete = async () => {
    if (clienteToDelete) {
      await deleteCliente.mutateAsync(clienteToDelete);
      setClienteToDelete(null);
    }
  };

  const columns: Column<Cliente>[] = [
    { 
      key: 'nome', 
      header: 'Cliente', 
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
            {c.avatar_url ? (
              <img src={c.avatar_url} alt={c.nomeFantasia} className="h-full w-full object-cover" />
            ) : (
              (c.nomeFantasia || 'C').charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-medium">{c.nomeFantasia || c.razaoSocial}</p>
            <p className="text-[11px] text-muted-foreground">{c.cnpj}</p>
          </div>
        </div>
      )

    },
    { 
      key: 'porte', 
      header: 'Porte', 
      render: (c) => <span className="text-sm">{c.porte || '-'}</span>,
      className: 'w-[100px]'
    },
    { 
      key: 'consultor', 
      header: 'Responsável', 
      render: (c) => <span className="text-sm">{c.consultorNome}</span> 
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (c) => <StatusTag label={c.status} />,
      className: 'w-[140px]'
    },
    { 
      key: 'portal', 
      header: 'Portal', 
      render: (c) => (
        <button 
          onClick={(e) => { e.stopPropagation(); setClientePortal(c); }}
          className={`text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 hover:brightness-95 transition-all ${
          c.portal_access_enabled 
            ? 'bg-green-100 text-green-700' 
            : c.auth_user_id 
              ? 'bg-yellow-100 text-yellow-700' 
              : 'bg-gray-100 text-gray-700'
        }`}>
          <Key className="h-2.5 w-2.5" />
          {c.portal_access_enabled ? 'Ativo' : c.auth_user_id ? 'Inativo' : 'Liberar'}
        </button>
      ),
      className: 'w-[100px]'
    },
    { 
      key: 'indice', 

      header: 'Índice Seven', 
      render: (c) => <span className="font-mono">{c.indiceSeven}</span>,
      className: 'w-[100px]'
    },
    {
      key: 'acoes',
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
              <DropdownMenuItem onClick={() => navigate(`/admin/cliente/${c.id}`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar / Ficha
              </DropdownMenuItem>
              {can('clientes', 'delete') && (
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setClienteToDelete(c.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setClientePortal(c)}>
                <Key className="mr-2 h-4 w-4" />
                Acesso ao Portal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      className: 'w-[50px]'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 p-8">
        <Skeleton className="h-12 w-[300px]" />
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
    <div className="space-y-6">
      <PageHeader titulo="Gestão de Clientes" subtitulo="Administração completa da carteira de clientes">
        {can('clientes', 'create') && (
          <Button onClick={() => navigate('/admin/cliente/novo')} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        )}
      </PageHeader>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome, razão social ou CNPJ..."
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
        onClear={() => { setSearch(''); setFilters({}); }}
      />

      <DataTable 
        data={data} 
        columns={columns} 
        onRowClick={(c) => navigate(`/admin/cliente/${c.id}`)} 
      />

      

      {clientePortal && (
        <ModalAcessoPortal 
          open={!!clientePortal} 
          onClose={() => setClientePortal(null)} 
          cliente={clientePortal} 
        />
      )}

      <AlertDialog open={!!clienteToDelete} onOpenChange={() => setClienteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita e removerá todos os dados vinculados.
              Recomendamos apenas alterar o status para "Encerrado" ou "Inativo" se desejar manter o histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
