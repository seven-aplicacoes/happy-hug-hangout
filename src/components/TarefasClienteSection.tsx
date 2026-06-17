import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, ListTodo, Calendar, User } from 'lucide-react';
import { useClienteTarefas } from '@/hooks/useClienteTarefas';
import { ModalDetalhesTarefa } from '@/components/modals/ModalDetalhesTarefa';
import { StatusTag } from '@/components/StatusTag';
import { labelStatus } from '@/data/mockData';
import type { Tarefa } from '@/types';

interface Props {
  clientId: string;
  onCreateTask: () => void;
}

const prioridadeLabel: Record<string, string> = {
  baixo: 'Baixa',
  medio: 'Média',
  alto: 'Alta',
  critico: 'Crítica',
};

const prioridadeColor: Record<string, string> = {
  baixo: 'bg-muted text-muted-foreground',
  medio: 'bg-blue-100 text-blue-700',
  alto: 'bg-amber-100 text-amber-700',
  critico: 'bg-red-100 text-red-700',
};

export const TarefasClienteSection = ({ clientId, onCreateTask }: Props) => {
  const { tarefas, isLoading } = useClienteTarefas(clientId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Re-derive selected from the live list so edits refresh the modal automatically
  const selected = selectedId ? (tarefas?.find(t => t.id === selectedId) || null) : null;

  const openDetail = (t: Tarefa) => {
    setSelectedId(t.id);
    setDetailOpen(true);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1.5 rounded-full bg-seven-success" />
          <h2 className="text-xl font-black uppercase tracking-tight">Tarefas do Cliente</h2>
          {tarefas && tarefas.length > 0 && (
            <Badge variant="secondary" className="ml-2">{tarefas.length}</Badge>
          )}
        </div>
        <Button onClick={onCreateTask} size="sm" className="gap-2 font-bold">
          <Plus className="h-4 w-4" /> Nova Tarefa
        </Button>
      </div>

      {isLoading ? (
        <Card><CardContent className="py-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/50" />
        </CardContent></Card>
      ) : !tarefas || tarefas.length === 0 ? (
        <Card className="border-dashed shadow-none bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <ListTodo className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-bold text-muted-foreground">Nenhuma tarefa cadastrada</h3>
            <p className="text-sm text-muted-foreground max-w-xs text-center mt-1 mb-4">
              As tarefas criadas para este cliente aparecerão aqui.
            </p>
            <Button onClick={onCreateTask} size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Criar tarefa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tarefas.map(t => (
            <Card
              key={t.id}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => openDetail(t)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-sm flex-1 truncate">{t.titulo}</p>
                  <StatusTag label={labelStatus[t.status] || t.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <Badge className={prioridadeColor[t.prioridade] || ''} variant="secondary">
                    {prioridadeLabel[t.prioridade] || t.prioridade}
                  </Badge>
                  {t.dataVencimento && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(t.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {t.consultorNome}
                  </span>
                  {t.contratoNome && t.contratoNome !== 'Sem contrato' && (
                    <Badge variant="outline" className="text-[10px]">{t.contratoNome}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ModalDetalhesTarefa
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelected(null); }}
        tarefa={selected}
      />
    </section>
  );
};
