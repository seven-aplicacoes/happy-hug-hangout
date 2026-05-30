import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable, Column } from '@/components/DataTable';
import { StatusTag } from '@/components/StatusTag';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { Cliente } from '@/types';

interface DashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: any[];
}

export function DashboardModal({ open, onOpenChange, title, data }: DashboardModalProps) {
  const navigate = useNavigate();

  const columns: Column<any>[] = [
    {
      key: 'nome',
      header: 'Cliente',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
            {c.avatar_url ? (
              <img src={c.avatar_url} alt={c.trade_name} className="h-full w-full object-cover" />
            ) : (
              (c.trade_name || 'C').charAt(0).toUpperCase()
            )}
          </div>
          <span className="font-medium">{c.trade_name}</span>
        </div>
      ),
    },
    { key: 'consultor', header: 'Consultor', render: (c) => <span className="text-xs">{c.consultorNome}</span> },
    { key: 'status', header: 'Status', render: (c) => <StatusTag label={c.status} /> },
    {
      key: 'dias',
      header: 'Dias s/ interação',
      render: (c) => (
        <span className={`font-mono text-sm font-bold ${c.diasSemInteracao > 15 ? 'text-seven-danger' : c.diasSemInteracao > 8 ? 'text-seven-warning' : ''}`}>
          {c.diasSemInteracao}d
        </span>
      ),
    },
    {
      key: 'acao',
      header: 'Ação',
      render: (c) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/cliente/${c.id}`)}>
          Ver ficha
        </Button>
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DataTable data={data} columns={columns} onRowClick={(c) => navigate(`/admin/cliente/${c.id}`)} />
      </DialogContent>
    </Dialog>
  );
}
