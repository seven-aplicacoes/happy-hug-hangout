import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { StatusTag } from '@/components/StatusTag';
import { FilterBar, FilterConfig } from '@/components/FilterBar';
import { DataTable, Column } from '@/components/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { labelStatusDoc, labelTipoDoc, variantStatusDoc, type StatusDocumento } from '@/data/documentos';
import { useClientes } from '@/hooks/useClientes';
import { useDocumentos } from '@/hooks/useDocumentos';
import { Skeleton } from '@/components/ui/skeleton';
import { ModalDocumento } from '@/components/modals/ModalDocumento';
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
  AlertDialogTitle as AlertDialogTitleLabel,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { FileText, FileCheck, AlertTriangle, Clock, Download, MessageSquare, Loader2, Plus, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useMyPermissions } from '@/hooks/useConsultantPermissions';
import type { Documento } from '@/types';

export default function DocumentosPage() {
  const navigate = useNavigate();
  const { perfil, isLoading: authLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Documento | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [docToEdit, setDocToEdit] = useState<Documento | null>(null);
  const [docToDelete, setDocToDelete] = useState<Documento | null>(null);
  const [novoStatus, setNovoStatus] = useState<StatusDocumento>('aprovado');
  const [feedbackTexto, setFeedbackTexto] = useState('');
  
  const { clientes, isLoading: loadingClientes } = useClientes();
  const { documentos, isLoading: isLoadingDocs, error: docsError, refetch, upsertDocumento, deleteDocumento, downloadFile } = useDocumentos();
  const { can, isLoading: loadingPermissions } = useMyPermissions();

  const isLoading = authLoading || loadingClientes || isLoadingDocs || loadingPermissions;

  const filterConfigs: FilterConfig[] = [
    { key: 'tipo', label: 'Tipo', options: Object.entries(labelTipoDoc).map(([v, l]) => ({ value: v, label: l })) },
    { key: 'status', label: 'Status', options: Object.entries(labelStatusDoc).map(([v, l]) => ({ value: v, label: l })) },
  ];

  const data = useMemo(() => {
    if (!documentos) return [];
    let d = [...documentos];
    const q = search.toLowerCase();
    if (q) d = d.filter(x => x.titulo.toLowerCase().includes(q) || (x.clienteNome || '').toLowerCase().includes(q));
    if (filters.tipo && filters.tipo !== 'todos') d = d.filter(x => x.tipo === filters.tipo);
    if (filters.status && filters.status !== 'todos') d = d.filter(x => x.status === filters.status);
    return d;
  }, [search, filters, documentos]);

  const totais = useMemo(() => ({
    total: documentos?.length || 0,
    aprovados: documentos?.filter(d => d.status === 'aprovado').length || 0,
    pendentes: documentos?.filter(d => d.status === 'pendente').length || 0,
    naoConformes: documentos?.filter(d => d.status === 'nao_conforme').length || 0,
  }), [documentos]);

  const aplicarFeedback = async () => {
    if (!selected) return;
    if (novoStatus !== 'aprovado' && !feedbackTexto.trim()) {
      toast({ title: 'Feedback obrigatório', description: 'Para Pendente ou Não conforme, registre uma observação.', variant: 'destructive' });
      return;
    }
    
    const novoFeedback = {
      id: crypto.randomUUID(),
      data: new Date().toISOString().split('T')[0],
      autor: perfil === 'admin' ? 'Gestor Seven' : (perfil === 'consultor' ? 'Consultor' : 'Usuário'),
      texto: feedbackTexto,
      statusAplicado: novoStatus,
    };

    await upsertDocumento.mutateAsync({
      doc: {
        id: selected.id,
        author_id: selected.author_id,
        status: novoStatus,
        feedbacks: [...(selected.feedbacks || []), novoFeedback],
      }
    });

    setSelected(null);
    setFeedbackTexto('');
    setNovoStatus('aprovado');
  };

  const handleDownload = async (doc: Documento) => {
    if (!doc.file_path) {
      toast({ title: 'Erro', description: 'Caminho do arquivo não encontrado.', variant: 'destructive' });
      return;
    }
    try {
      await downloadFile(doc.file_path, doc.file_name || doc.titulo || 'arquivo');
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível baixar o arquivo.', variant: 'destructive' });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const columns: Column<Documento>[] = [
    { key: 'titulo', header: 'Documento', render: d => (
      <div>
        <p className="font-medium text-sm">{d.titulo}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>{(labelTipoDoc as any)[d.tipo]}</span>
          {d.fase && <span>· {d.fase}</span>}
          {d.file_path && <span className="flex items-center gap-0.5 text-primary/70"><FileText className="h-3 w-3" /> Real</span>}
        </div>
      </div>
    )},
    { key: 'clienteNome', header: 'Cliente', render: d => <span className="text-xs">{d.clienteNome}</span> },
    { key: 'autor', header: 'Autor', render: d => <span className="text-xs text-muted-foreground">{d.autor}</span> },
    { key: 'data', header: 'Data', render: d => <span className="text-xs tabular-nums">{d.data}</span>, className: 'w-[100px]' },
    { key: 'status', header: 'Status', render: d => <StatusTag label={(labelStatusDoc as any)[d.status]} variant={(variantStatusDoc as any)[d.status]} />, className: 'w-[120px]' },
    { key: 'feedbacks' as any, header: 'Feedback', render: d => (d.feedbacks?.length || 0) > 0
      ? <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MessageSquare className="h-3 w-3" />{d.feedbacks.length}</span>
      : <span className="text-[11px] text-muted-foreground">—</span>,
      className: 'w-[90px]',
    },
    { key: 'visibility' as any, header: 'Visibilidade', render: d => (
      <span className="text-[11px] uppercase tracking-wider font-medium">
        {d.visibility === 'internal' ? 'Interno' : (d.visibility === 'client' ? 'Cliente' : 'Todos')}
      </span>
    ), className: 'w-[100px]' },
    {
      key: 'acoes' as any,
      header: '',
      render: d => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload(d)}>
                <Download className="mr-2 h-4 w-4" />
                Baixar/Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setDocToEdit(d); setModalOpen(true); }}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => setDocToDelete(d)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      className: 'w-[50px]'
    }
  ];

  if (docsError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div>
          <h2 className="text-xl font-bold">Erro ao carregar documentos</h2>
          <p className="text-muted-foreground">Ocorreu um problema ao buscar os dados do servidor.</p>
          <p className="text-xs text-muted-foreground mt-2">{(docsError as any)?.message || 'Erro desconhecido'}</p>
        </div>
        <Button onClick={() => refetch()}>Tentar Novamente</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader titulo="Documentos" subtitulo="Carregando..." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" /><Skeleton className="h-24" />
          <Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Verifica permissão APENAS se não estiver carregando e se for consultor
  if (perfil === 'consultor' && !can('documentos')) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Você não tem permissão para acessar este módulo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader titulo="Documentos" subtitulo="Atas e entregáveis metodológicos">
        <Button className="gap-2" onClick={() => { setDocToEdit(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" />
          Novo Documento
        </Button>
      </PageHeader>

      <section>
        <SectionHeader overline="Visão geral" titulo="Status da pasta" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard titulo="Total" valor={totais.total} icon={FileText} />
          <StatCard titulo="Aprovados" valor={totais.aprovados} icon={FileCheck} variant="success" />
          <StatCard titulo="Pendentes" valor={totais.pendentes} icon={Clock} variant="warning" />
          <StatCard titulo="Não conformes" valor={totais.naoConformes} icon={AlertTriangle} variant="danger" />
        </div>
      </section>

      <section>
        <FilterBar
          searchValue={search} onSearchChange={setSearch}
          searchPlaceholder="Buscar documento ou cliente..."
          filters={filterConfigs} filterValues={filters}
          onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
          onClear={() => { setSearch(''); setFilters({}); }}
        />
        <Card>
          <CardContent className="p-0">
            <DataTable data={data} columns={columns} onRowClick={(d) => setSelected(d)} />
          </CardContent>
        </Card>
      </section>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.titulo}</DialogTitle>
                <DialogDescription>
                  {(labelTipoDoc as any)[selected.tipo]} · {selected.clienteNome} · por {selected.autor} em {selected.data}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-md border">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{selected.file_name || selected.arquivo}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {selected.file_type && `${selected.file_type} · `}
                        {formatFileSize(selected.file_size)}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDownload(selected)}
                    disabled={perfil === 'consultor' && !can('documentos', 'export')}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />Baixar
                  </Button>
                </div>

                <div>
                  <p className="ui-overline mb-2">Status atual</p>
                  <StatusTag label={(labelStatusDoc as any)[selected.status]} variant={(variantStatusDoc as any)[selected.status]} />
                </div>

                {(selected.feedbacks?.length || 0) > 0 && (
                  <div className="space-y-2">
                    <p className="ui-overline">Histórico de feedback</p>
                    {selected.feedbacks.map(fb => (
                      <div key={fb.id} className="border-l-2 border-border pl-3 py-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <span className="font-medium text-foreground">{fb.autor}</span>
                          <span>·</span>
                          <span>{fb.data}</span>
                          <StatusTag label={(labelStatusDoc as any)[fb.statusAplicado]} variant={(variantStatusDoc as any)[fb.statusAplicado]} />
                        </div>
                        <p className="text-sm">{fb.texto}</p>
                      </div>
                    ))}
                  </div>
                )}

                {(perfil === 'admin' || perfil === 'consultor') && (
                  <div className="border-t pt-4 space-y-3">
                    <p className="ui-overline">Atualizar status</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="ui-overline">Novo status</Label>
                        <Select value={novoStatus} onValueChange={(v) => setNovoStatus(v as StatusDocumento)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(labelStatusDoc).map(([v, l]) => (
                              <SelectItem key={v} value={v}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="ui-overline">Feedback do gestor {novoStatus !== 'aprovado' && '*'}</Label>
                      <Textarea value={feedbackTexto} onChange={(e) => setFeedbackTexto(e.target.value)} rows={3}
                        placeholder="Observação sobre a aprovação ou ajuste necessário..." />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
                      <Button onClick={aplicarFeedback} disabled={upsertDocumento.isPending}>
                        {upsertDocumento.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ModalDocumento 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setDocToEdit(null); }} 
        documento={docToEdit} 
      />

      <AlertDialog open={!!docToDelete} onOpenChange={() => setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitleLabel>Excluir Documento</AlertDialogTitleLabel>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita e removerá o arquivo permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if (docToDelete) {
                  await deleteDocumento.mutateAsync(docToDelete.id);
                  setDocToDelete(null);
                }
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}