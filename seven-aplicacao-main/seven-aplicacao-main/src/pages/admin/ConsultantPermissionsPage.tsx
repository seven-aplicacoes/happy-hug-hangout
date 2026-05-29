import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatusTag } from '@/components/StatusTag';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  Search, 
  Settings2, 
  RefreshCcw,
  LayoutDashboard,
  Users,
  UserSquare2,
  Calendar,
  CheckSquare,
  FileText,
  BookOpen,
  BarChart3,
  UserCircle,
  Loader2
} from 'lucide-react';
import { useConsultores, ConsultantProfile } from '@/hooks/useConsultores';
import { useConsultantPermissions, ConsultantPermission } from '@/hooks/useConsultantPermissions';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

interface ConsultantRow {
  id: string;
  nome: string;
  email: string;
  status: string;
  permissoesAtivas: number;
}

const moduleIcons: Record<string, any> = {
  dashboard: LayoutDashboard,
  clientes: Users,
  ficha_cliente: UserSquare2,
  reunioes: Calendar,
  tarefas: CheckSquare,
  documentos: FileText,
  metodologia: BookOpen,
  indicadores: BarChart3,
  perfil: UserCircle,
};

export default function ConsultantPermissionsPage() {
  const { consultores, isLoading: loadingConsultores } = useConsultores();
  const [selectedConsultant, setSelectedConsultant] = useState<ConsultantRow | null>(null);
  const [search, setSearch] = useState('');
  
  const { 
    permissions, 
    isLoading: loadingPermissions, 
    updatePermission,
    restoreDefaults 
  } = useConsultantPermissions(selectedConsultant?.id);

  const filteredConsultores = useMemo(() => {
    if (!consultores) return [];
    const q = search.toLowerCase();
    return consultores
      .filter(c => c.role === 'consultor')
      .map(c => ({
        id: c.id,
        nome: c.full_name || 'Sem nome',
        email: c.email,
        status: c.status || 'ativo',
        permissoesAtivas: 0, // In a real scenario, we might want to fetch this count
      }))
      .filter(c => 
        c.nome.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q)
      );
  }, [consultores, search]);

  const columns: Column<ConsultantRow>[] = [
    {
      key: 'nome',
      header: 'Usuário',
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
    {
      key: 'status',
      header: 'Status',
      render: (c) => <StatusTag label={c.status === 'ativo' ? 'Ativo' : 'Inativo'} variant={c.status === 'ativo' ? 'success' : 'neutral'} />,
    },
    {
      key: 'acoes' as any,
      header: '',
      render: (c) => (
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedConsultant(c);
          }}
        >
          <Settings2 className="h-4 w-4" />
          Gerenciar Permissões
        </Button>
      ),
    }
  ];

  const handleToggle = async (permission: ConsultantPermission, field: keyof ConsultantPermission) => {
    try {
      await updatePermission.mutateAsync({
        id: permission.id,
        [field]: !permission[field],
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRestore = async () => {
    if (!selectedConsultant) return;
    try {
      await restoreDefaults.mutateAsync(selectedConsultant.id);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        titulo="Permissões de Usuários" 
        subtitulo="Controle o acesso aos módulos da área do usuário"
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Lista de Usuários
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredConsultores}
            columns={columns}
            pageSize={10}
            onRowClick={(c) => setSelectedConsultant(c)}
            emptyMessage={loadingConsultores ? "Carregando usuários..." : "Nenhum usuário encontrado."}
          />
        </CardContent>
      </Card>

      <Sheet open={!!selectedConsultant} onOpenChange={(open) => !open && setSelectedConsultant(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Gerenciar Permissões</SheetTitle>
            <SheetDescription>
              Ajuste o que <strong>{selectedConsultant?.nome}</strong> pode acessar na plataforma.
            </SheetDescription>
            {selectedConsultant && (
              <div className="mt-2 p-3 bg-muted rounded-md border border-border">
                <p className="text-sm font-medium">{selectedConsultant.nome}</p>
                <p className="text-xs text-muted-foreground">{selectedConsultant.email}</p>
              </div>
            )}
          </SheetHeader>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Módulos do Usuário</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs gap-1.5"
                onClick={handleRestore}
                disabled={restoreDefaults.isPending}
              >
                {restoreDefaults.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCcw className="h-3 w-3" />
                )}
                Restaurar Padrão
              </Button>
            </div>

            <div className="space-y-4">
              {loadingPermissions ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Carregando permissões...</p>
                </div>
              ) : permissions?.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg border-border">
                  <p className="text-sm text-muted-foreground">Nenhuma permissão encontrada.</p>
                  <Button variant="link" onClick={handleRestore} className="mt-2">
                    Gerar permissões padrão agora
                  </Button>
                </div>
              ) : (
                permissions?.map((p) => {
                  const Icon = moduleIcons[p.module_key] || Shield;
                  return (
                    <Card key={p.id} className="overflow-hidden border-border/50">
                      <div className="p-4 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-background border border-border">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm">{p.module_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Visualizar</span>
                          <Switch 
                            checked={p.can_view} 
                            onCheckedChange={() => handleToggle(p, 'can_view')}
                            disabled={updatePermission.isPending}
                          />
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-4 gap-4">
                        {[
                          { key: 'can_create', label: 'Criar' },
                          { key: 'can_edit', label: 'Editar' },
                          { key: 'can_delete', label: 'Excluir' },
                          { key: 'can_export', label: 'Exportar' },
                        ].map((action) => (
                          <div key={action.key} className="flex flex-col gap-2 items-center">
                            <span className="text-[10px] text-muted-foreground uppercase">{action.label}</span>
                            <Switch 
                              checked={p[action.key as keyof ConsultantPermission] as boolean} 
                              onCheckedChange={() => handleToggle(p, action.key as keyof ConsultantPermission)}
                              disabled={!p.can_view || updatePermission.isPending}
                            />
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
