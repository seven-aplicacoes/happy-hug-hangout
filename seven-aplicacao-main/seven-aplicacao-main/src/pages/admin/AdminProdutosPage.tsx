import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { DataTable, Column } from '@/components/DataTable';
import { useProdutos } from '@/hooks/useProdutos';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, MoreVertical, Edit, Trash2, Package, Power, PowerOff } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
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
import { ModalProduto } from '@/components/modals/ModalProduto';
import type { Product } from '@/types';
import { formatDuration } from '@/lib/duration';

export default function AdminProdutosPage() {
  const { produtos, isLoading, deleteProduto, updateProduto } = useProdutos();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Product | null>(null);
  const [produtoToDelete, setProdutoToDelete] = useState<string | null>(null);

  const filteredData = (produtos || [])
    .filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (a.status === 'ativo' && b.status === 'inativo') return -1;
      if (a.status === 'inativo' && b.status === 'ativo') return 1;
      return a.name.localeCompare(b.name);
    });

  const handleDelete = async () => {
    if (produtoToDelete) {
      await deleteProduto.mutateAsync(produtoToDelete);
      setProdutoToDelete(null);
    }
  };

  const columns: Column<Product>[] = [
    { 
      key: 'name', 
      header: 'Produto', 
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-md flex items-center justify-center ${p.status === 'inativo' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
            <Package className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className={`font-medium ${p.status === 'inativo' ? 'text-muted-foreground line-through' : ''}`}>
              {p.name}
            </span>
            {p.status === 'inativo' && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Inativo</span>}
          </div>
        </div>
      )
    },
    { 
      key: 'description', 
      header: 'Descrição', 
      render: (p) => <span className="text-sm text-muted-foreground line-clamp-1">{p.description || '—'}</span> 
    },
    { 
      key: 'category', 
      header: 'Categoria', 
      render: (p) => <span className="text-sm capitalize">{p.category || '—'}</span> 
    },
    { 
      key: 'consultant_hours', 
      header: 'Duração Consultor', 
      render: (p) => <span className="text-sm font-medium">{formatDuration(p.consultant_hours)}</span>
    },
    { 
      key: 'silvane_hours', 
      header: 'Duração Silvane', 
      render: (p) => <span className="text-sm font-medium">{formatDuration(p.silvane_hours)}</span>
    },
    {
      key: 'acoes',
      header: '',
      render: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setSelectedProduto(p); setModalOpen(true); }}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={async () => {
                await updateProduto.mutateAsync({
                  id: p.id,
                  status: p.status === 'ativo' ? 'inativo' : 'ativo'
                });
              }}
            >
              {p.status === 'ativo' ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Inativar
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Ativar
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => setProdutoToDelete(p.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

  return (
    <div className="space-y-6">
      <PageHeader titulo="Gestão de Produtos" subtitulo="Cadastro de soluções e serviços do portfólio">
        <Button onClick={() => { setSelectedProduto(null); setModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </PageHeader>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou descrição..."
      />

      <DataTable data={filteredData} columns={columns} />

      <ModalProduto 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setSelectedProduto(null); }} 
        produto={selectedProduto} 
      />

      <AlertDialog open={!!produtoToDelete} onOpenChange={() => setProdutoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
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