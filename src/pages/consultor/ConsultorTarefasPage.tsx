import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { TaskCard } from '@/components/TaskCard';
import { StatusTag } from '@/components/StatusTag';
import { BaseModal } from '@/components/BaseModal';
import { useAuth } from '@/contexts/AuthContext';
import { labelStatus } from '@/data/mockData';
import { useTarefas } from '@/hooks/useTarefas';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ModalNovaTarefaChamado } from '@/components/modals/ModalNovaTarefaChamado';
import { ModalDetalhesTarefa } from '@/components/modals/ModalDetalhesTarefa';
import { Plus, Loader2 } from 'lucide-react';
import { useMyPermissions } from '@/hooks/useConsultantPermissions';
import type { Tarefa, StatusTarefa } from '@/types';
import { TASK_STATUS_CONFIG } from '@/constants/taskStatus';

const colunas = Object.values(TASK_STATUS_CONFIG);

export default function ConsultorTarefasPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const consultorId = user?.consultorId;
  const { tarefas, isLoading, upsertTarefa, deleteTarefa } = useTarefas();
  const [tarefasState, setTarefasState] = useState<Tarefa[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [impedimentoModal, setImpedimentoModal] = useState<{ tarefaId: string; novoStatus: StatusTarefa } | null>(null);
  const [motivo, setMotivo] = useState('');
  const [novaDemandaOpen, setNovaDemandaOpen] = useState(false);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'minhas' | 'chamados_abertos' | 'chamados_recebidos'>('todos');

  const { can, isLoading: loadingPermissions } = useMyPermissions();

  useEffect(() => {
    if (tarefas) setTarefasState(tarefas);
  }, [tarefas]);

  const tarefasFiltradas = tarefasState.filter(t => {
    if (filtroTipo === 'todos') return true;
    if (filtroTipo === 'minhas') return t.consultorId === consultorId && t.tipo !== 'chamado';
    if (filtroTipo === 'chamados_abertos') return t.tipo === 'chamado' && t.createdBy === user?.id;
    if (filtroTipo === 'chamados_recebidos') return t.tipo === 'chamado' && t.consultorId === consultorId;
    return true;
  });

  const chamadosAbertosCount = tarefasState.filter(t => t.tipo === 'chamado' && t.status !== 'concluida').length;

  const emptyMessage = filtroTipo === 'todos'
    ? 'Nenhuma demanda encontrada.'
    : filtroTipo === 'minhas'
      ? 'Nenhuma tarefa cadastrada.'
      : filtroTipo === 'chamados_abertos'
        ? 'Nenhum chamado aberto.'
        : 'Nenhum chamado recebido.';

  const handleDragStart = (tarefaId: string) => setDragging(tarefaId);

  const handleDrop = (novoStatus: StatusTarefa) => {
    if (!dragging) return;
    if (novoStatus === 'impedida') {
      setImpedimentoModal({ tarefaId: dragging, novoStatus });
    } else {
      moverTarefa(dragging, novoStatus);
    }
    setDragging(null);
  };

  const moverTarefa = async (tarefaId: string, novoStatus: StatusTarefa, motivoImpedimento?: string) => {
    const tarefa = tarefas?.find(t => t.id === tarefaId);
    if (!tarefa) return;

    setTarefasState(prev => prev.map(t =>
      t.id === tarefaId
        ? { ...t, status: novoStatus, motivoImpedimento: motivoImpedimento || (novoStatus === 'impedida' ? t.motivoImpedimento : t.motivoImpedimento) }
        : t
    ));

    try {
      const payload: any = { ...tarefa, status: novoStatus };
      if (motivoImpedimento && novoStatus === 'impedida') {
        payload.novoImpedimento = { reason: motivoImpedimento };
      }
      await upsertTarefa.mutateAsync(payload);
    } catch (error) {
      setTarefasState(tarefas || []);
    }
  };

  const confirmarImpedimento = () => {
    if (!motivo.trim()) {
      toast({ title: 'Motivo obrigatório', description: 'Informe o motivo do impedimento.', variant: 'destructive' });
      return;
    }
    if (impedimentoModal) {
      moverTarefa(impedimentoModal.tarefaId, 'impedida', motivo.trim());
    }
    setImpedimentoModal(null);
    setMotivo('');
  };

  if (isLoading || loadingPermissions) {
    return (
      <div className="space-y-8 p-8">
        <Skeleton className="h-12 w-[300px]" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-[400px]" /><Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" /><Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!can('tarefas')) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Você não tem permissão para acessar este módulo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <PageHeader titulo="Minhas Tarefas" subtitulo="Gerencie suas demandas por status">
        {can('tarefas', 'create') && (
          <Button size="sm" onClick={() => setNovaDemandaOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Nova Demanda
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        {([
          { k: 'todos' as const, l: 'Todos' },
          { k: 'minhas' as const, l: 'Minhas tarefas' },
          { k: 'chamados_abertos' as const, l: `Chamados abertos${chamadosAbertosCount > 0 ? ` · ${chamadosAbertosCount}` : ''}` },
          { k: 'chamados_recebidos' as const, l: 'Chamados recebidos' },
        ]).map(opt => (
          <Button key={opt.k} size="sm"
            variant={filtroTipo === opt.k ? 'default' : 'outline'}
            onClick={() => setFiltroTipo(opt.k)}
            className="h-8 text-xs">
            {opt.l}
          </Button>
        ))}
      </div>

      <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
        <div className="flex flex-nowrap gap-4 min-w-max pr-4">
          {colunas.map(col => {
            const items = tarefasFiltradas.filter(t => t.status === col.value);
            return (
              <div
                key={col.value}
                className={`rounded-md border border-t-4 ${col.color} bg-card p-3 min-h-[500px] w-[300px] flex flex-col shrink-0`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(col.value)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="space-y-2 flex-1">
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60 italic text-center py-6">{emptyMessage}</p>
                  ) : items.map(t => (
                    <TaskCard
                      key={t.id}
                      tarefa={t}
                      draggable={can('tarefas', 'edit')}
                      onDragStart={() => can('tarefas', 'edit') && handleDragStart(t.id)}
                      onClick={() => { setSelectedTarefa(t); setDetalhesOpen(true); }}
                      onDelete={(id) => deleteTarefa.mutate(id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BaseModal
        open={!!impedimentoModal}
        onClose={() => { setImpedimentoModal(null); setMotivo(''); }}
        titulo="Registrar Impedimento"
        descricao="Informe o motivo do impedimento desta tarefa."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Motivo do impedimento *</Label>
            <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Descreva o que está impedindo a tarefa..." rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setImpedimentoModal(null); setMotivo(''); }}>Cancelar</Button>
            <Button onClick={confirmarImpedimento}>Confirmar Impedimento</Button>
          </div>
        </div>
      </BaseModal>

      <ModalNovaTarefaChamado open={novaDemandaOpen} onClose={() => setNovaDemandaOpen(false)} />
      <ModalDetalhesTarefa open={detalhesOpen} onClose={() => { setDetalhesOpen(false); setSelectedTarefa(null); }} tarefa={selectedTarefa} />
    </div>
  );
}
