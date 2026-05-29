import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent } from '@/components/ui/card';
import { StatusTag, StatusVariant } from '@/components/StatusTag';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, Activity, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useContratos } from '@/hooks/useContratos';
import { useClientes } from '@/hooks/useClientes';
import { Skeleton } from '@/components/ui/skeleton';
import { ModalContrato } from '@/components/modals/ModalContrato';
import type { Contrato } from '@/types';
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
import { toast } from '@/hooks/use-toast';
import {
  getDistribuicaoTempoDetalhada, getNovosContratosPorMes,
} from '@/data/contratosAnalytics';
import { labelStatus, labelFase, labelRisco } from '@/data/mockData';

export default function AdminContratosPage() {
  const navigate = useNavigate();
  const [mes, setMes] = useState<string>('todos');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [contratoToDelete, setContratoToDelete] = useState<string | null>(null);

  const { contratos, isLoading: loadingContratos, deleteContrato } = useContratos();
  const { clientes, isLoading: loadingClientes } = useClientes();

  const isLoading = loadingContratos || loadingClientes;

  const novos = useMemo(() => getNovosContratosPorMes(12), []);
  const tempo = useMemo(() => getDistribuicaoTempoDetalhada(), []);

  const stats = useMemo(() => {
    if (!contratos) return null;
    const total = contratos.length;
    const ativos = contratos.filter(c => c.status === 'ativo').length;
    const novosMes = mes === 'todos'
      ? novos[novos.length - 1]?.total || 0
      : novos.find(n => n.key === mes)?.total || 0;

    const ticketMedio = Math.round(contratos.reduce((s, c) => s + c.valor, 0) / Math.max(1, contratos.length));

    return { total, ativos, novosMes, ticketMedio };
  }, [contratos, mes, novos]);

  if (isLoading) {
    return (
      <div className="space-y-8 p-8">
        <Skeleton className="h-12 w-[300px]" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" /><Skeleton className="h-32" />
          <Skeleton className="h-32" /><Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!stats) return null;
  const { total, ativos, novosMes, ticketMedio } = stats;

  return (
    <div className="space-y-10">
      <PageHeader titulo="Gestão de Contratos" subtitulo="Visão estratégica de portfólio, evolução e renovações">
        <Button className="gap-2" onClick={() => { setSelectedContrato(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" />
          Novo Contrato
        </Button>
      </PageHeader>

      <section className="space-y-5">
        <SectionHeader overline="Visão geral" titulo="Portfólio e novos contratos" descricao="Indicadores macro da carteira de contratos." />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard titulo="Total de contratos" valor={total} icon={FileText} />
          <StatCard titulo="Ativos" valor={ativos} subtitulo={`${Math.round((ativos / (total || 1)) * 100)}% do portfólio`} variant="success" icon={Activity} />
          <StatCard titulo="Novos no período" valor={novosMes} variant="info" icon={TrendingUp}
            subtitulo={mes === 'todos' ? 'Último mês' : (novos.find(n => n.key === mes)?.mes + '/' + novos.find(n => n.key === mes)?.ano)} />
          <StatCard titulo="Ticket médio" valor={`R$ ${(ticketMedio / 1000).toFixed(1)}k`} icon={TrendingUp} />
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeader overline="Listagem" titulo="Contratos recentes" />
        <Card>
          <CardContent className="p-0 overflow-x-auto">
             <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold border-b border-border/60">
                    <th className="text-left p-4">Cliente</th>
                    <th className="text-left p-4">Tipo / Produto</th>
                    <th className="text-right p-4">Valor</th>
                    <th className="text-left p-4">Responsável</th>
                    <th className="text-left p-4">Fase</th>
                    <th className="text-left p-4">Status</th>
                    <th className="w-[50px] p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {contratos?.map(c => (
                    <tr key={c.id} className="border-b border-border/30 hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/admin/cliente/${c.clienteId}`)}>
                      <td className="p-4 font-medium">{c.clienteNome}</td>
                      <td className="p-4 text-xs">{c.tipo}</td>
                      <td className="p-4 text-right tabular-nums">R$ {c.valor.toLocaleString('pt-BR')}</td>
                      <td className="p-4 text-xs text-muted-foreground">{c.consultorNome}</td>
                      <td className="p-4 text-xs">{(labelFase as any)[c.faseMetodologica] || c.faseMetodologica}</td>
                      <td className="p-4"><StatusTag label={(labelStatus as any)[c.status] || c.status} /></td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedContrato(c); setModalOpen(true); }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => setContratoToDelete(c.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </CardContent>
        </Card>
      </section>

      <ModalContrato 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setSelectedContrato(null); }} 
        contrato={selectedContrato} 
      />

      <AlertDialog open={!!contratoToDelete} onOpenChange={() => setContratoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if (contratoToDelete) {
                  await deleteContrato.mutateAsync(contratoToDelete);
                  setContratoToDelete(null);
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
