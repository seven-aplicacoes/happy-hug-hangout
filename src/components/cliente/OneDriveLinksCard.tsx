import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cloud, ExternalLink, Pencil, Trash2, Plus, FolderOpen, Loader2 } from 'lucide-react';
import { useClienteOneDriveLinks, type OneDriveLink } from '@/hooks/useClienteOneDriveLinks';
import { ModalOneDriveLink } from '@/components/modals/ModalOneDriveLink';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPermissions } from '@/hooks/useConsultantPermissions';

const CATEGORY_LABEL: Record<string, string> = {
  pasta_principal: 'Pasta principal',
  atas: 'Atas',
  documentos_internos: 'Documentos internos',
  entregaveis: 'Entregáveis',
  outros: 'Outros',
};

interface Props {
  clientId: string;
}

export function OneDriveLinksCard({ clientId }: Props) {
  const { perfil } = useAuth();
  const { can } = useMyPermissions();
  const isAdmin = perfil === 'admin';
  const isClient = perfil === 'cliente';
  const canManage = isAdmin || (!isClient && (can('documentos', 'create') || can('ficha_cliente', 'edit')));
  const canDelete = isAdmin || (!isClient && (can('documentos', 'delete') || can('ficha_cliente', 'edit')));

  const { links, isLoading, deleteLink } = useClienteOneDriveLinks(clientId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OneDriveLink | null>(null);

  if (isClient) return null;

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (l: OneDriveLink) => { setEditing(l); setModalOpen(true); };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1.5 rounded-full bg-blue-500" />
          <h2 className="text-xl font-black uppercase tracking-tight">OneDrive do Cliente</h2>
        </div>
        {canManage && (
          <Button size="sm" onClick={openNew} className="gap-1.5 font-bold">
            <Plus className="h-4 w-4" /> Adicionar link
          </Button>
        )}
      </div>

      <Card className="shadow-xl border-muted/40 bg-white/50 backdrop-blur-sm">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/50" /></div>
          ) : links.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Cloud className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Nenhum link do OneDrive cadastrado</p>
              <p className="text-xs mt-1">Adicione o link da pasta do cliente para facilitar o acesso aos documentos.</p>
              {canManage && (
                <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={openNew}>
                  <Plus className="h-4 w-4" /> Adicionar link
                </Button>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {links.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-blue-50/30 hover:border-blue-200 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm truncate">{l.title}</span>
                      {l.category && CATEGORY_LABEL[l.category] && (
                        <Badge variant="secondary" className="text-[10px] font-semibold">{CATEGORY_LABEL[l.category]}</Badge>
                      )}
                    </div>
                    {l.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{l.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-8"
                      onClick={() => window.open(l.url, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Abrir
                    </Button>
                    {canManage && (
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(l)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Remover o link "${l.title}"?`)) deleteLink.mutate(l.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ModalOneDriveLink
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        clientId={clientId}
        link={editing}
      />
    </section>
  );
}
