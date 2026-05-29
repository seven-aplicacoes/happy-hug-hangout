import { useState, useMemo } from 'react';
import { useDocumentos } from '@/hooks/useDocumentos';
import { DataTable, Column } from '@/components/DataTable';
import { StatusTag } from '@/components/StatusTag';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Download, Trash2, FileText, ExternalLink, MoreVertical } from 'lucide-react';
import { labelTipoDoc, labelStatusDoc, variantStatusDoc } from '@/data/documentos';
import { ModalDocumento } from '@/components/modals/ModalDocumento';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPermissions } from '@/hooks/useConsultantPermissions';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import type { Documento } from '@/types';

interface ClientDocumentsTabProps {
  clientId: string;
}

export const ClientDocumentsTab = ({ clientId }: ClientDocumentsTabProps) => {
  const { documentos, isLoading, deleteDocumento, downloadFile } = useDocumentos();
  const { can } = useMyPermissions();
  const { perfil } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [docToEdit, setDocToEdit] = useState<Documento | null>(null);

  const clientDocs = useMemo(() => 
    (documentos || []).filter(d => d.clienteId === clientId), 
  [documentos, clientId]);

  const columns: Column<Documento>[] = [
    { 
      key: 'titulo', 
      header: 'Documento', 
      render: d => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
            <FileText className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">{d.titulo}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
              {(labelTipoDoc as any)[d.tipo] || d.tipo}
            </p>
          </div>
        </div>
      )
    },
    { 
      key: 'data', 
      header: 'Data', 
      render: d => <span className="text-xs font-medium text-muted-foreground">{new Date(d.data).toLocaleDateString('pt-BR')}</span> 
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: d => <StatusTag label={(labelStatusDoc as any)[d.status]} variant={(variantStatusDoc as any)[d.status]} /> 
    },
    {
      key: 'visibility',
      header: 'Visibilidade',
      render: d => (
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {d.visibility === 'internal' ? 'Interno' : (d.visibility === 'client' ? 'Cliente' : 'Todos')}
        </span>
      )
    },
    {
      key: 'acoes' as any,
      header: '',
      render: d => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => downloadFile(d.file_path || '', d.file_name || 'documento')}>
              <Download className="mr-2 h-4 w-4" /> Baixar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setDocToEdit(d); setModalOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => deleteDocumento.mutate(d.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-[50px]'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">Biblioteca de Documentos</h2>
          <p className="text-sm text-muted-foreground">Atas, entregáveis e materiais compartilhados.</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => { setDocToEdit(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" /> Novo Documento
        </Button>
      </div>

      <Card className="border-muted/40 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <DataTable 
            data={clientDocs} 
            columns={columns} 
            isLoading={isLoading}
            emptyMessage="Nenhum documento encontrado para este cliente."
          />
        </CardContent>
      </Card>

      <ModalDocumento 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setDocToEdit(null); }} 
        documento={docToEdit}
        initialData={{ clienteId: clientId }}
      />
    </div>
  );
};
