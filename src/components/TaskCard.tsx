import { Card, CardContent } from '@/components/ui/card';
import { StatusTag } from '@/components/StatusTag';
import { getTaskStatusLabel, getTaskStatusVariant } from '@/constants/taskStatus';
import { contextoEstrategicoTarefa } from '@/data/documentos';
import type { Tarefa, NivelRisco, OrigemDemanda } from '@/types';
import { Calendar, Building2, Zap, Tag, FileText, Video, UserCheck, RotateCcw, Headphones, AlertTriangle, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TaskCardProps {
  tarefa: Tarefa;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
}

const tipoLabel: Record<string, string> = {
  consultoria: 'Consultoria',
  chamado: 'Chamado',
  interna: 'Interna',
};

const prioridadeBorder: Record<NivelRisco, string> = {
  critico: 'border-l-seven-danger',
  alto: 'border-l-orange-500',
  medio: 'border-l-seven-warning',
  baixo: 'border-l-seven-success',
};

const prioridadeLabel: Record<NivelRisco, string> = {
  critico: 'Crítico',
  alto: 'Alto',
  medio: 'Médio',
  baixo: 'Baixo',
};

const origemConfig: Record<OrigemDemanda, { icon: typeof Video; label: string }> = {
  reuniao: { icon: Video, label: 'Reunião' },
  gestor: { icon: UserCheck, label: 'Gestor' },
  rotina_automatica: { icon: RotateCcw, label: 'Automática' },
  chamado: { icon: Headphones, label: 'Chamado' },
};

export const TaskCard = ({ tarefa, onClick, draggable, onDragStart, onDelete }: TaskCardProps) => {
  const OrigemIcon = tarefa.origem ? origemConfig[tarefa.origem]?.icon : null;
  const origemLabel = tarefa.origem ? origemConfig[tarefa.origem]?.label : null;
  const contexto = contextoEstrategicoTarefa(tarefa.clienteId);

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all border-l-4',
        prioridadeBorder[tarefa.prioridade]
      )}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <CardContent className="p-4 space-y-2">
        {tarefa.origem === 'reuniao' && (
          <div className="flex items-center gap-1 bg-primary/10 text-primary rounded px-2 py-0.5 text-[10px] font-medium w-fit">
            <Zap className="h-3 w-3" />Gerada em reunião
          </div>
        )}

        <div className="flex justify-between items-start gap-2">
          <p className="text-sm font-medium text-foreground leading-tight">{tarefa.titulo}</p>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 -mt-1 -mr-1"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(tarefa.id, e);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {contexto && (
          <div className="flex items-start gap-1.5 bg-seven-warning/10 text-seven-warning rounded px-2 py-1 text-[11px] leading-tight">
            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
            <span>{contexto}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1" title="Cliente"><Building2 className="h-3 w-3" />{tarefa.clienteNome}</span>
          <span className="flex items-center gap-1" title="Contrato"><FileText className="h-3 w-3" />{tarefa.contratoNome}</span>
          {tarefa.produtoNome && (
            <span className="flex items-center gap-1" title="Produto"><Zap className="h-3 w-3" />{tarefa.produtoNome}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1" title="Vencimento"><Calendar className="h-3 w-3" />{tarefa.dataVencimento || 'Sem data'}</span>
          <span className="flex items-center gap-1" title="Tipo"><Tag className="h-3 w-3" />{tipoLabel[tarefa.tipo] || tarefa.tipo}</span>
        </div>

        <div className="space-y-1 pt-1 border-t border-muted-foreground/10">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground" title="Responsável">
            <UserCheck className="h-3 w-3 text-primary/70" />
            <span className="font-semibold text-foreground/80">Resp.:</span> {tarefa.consultorNome || 'Não informado'}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground" title="Criador">
            <User className="h-3 w-3 opacity-60" />
            <span className="font-semibold">Criador:</span> {tarefa.createdByName || 'Não informado'}
          </div>
          {tarefa.delegatedByName && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground" title="Delegada por">
              <UserCheck className="h-3 w-3 opacity-60" />
              <span className="font-semibold">Delegado por:</span> {tarefa.delegatedByName}
            </div>
          )}
        </div>

        {tarefa.status === 'impedida' && tarefa.motivoImpedimento && (
          <p className="text-xs text-seven-danger bg-seven-danger/10 rounded px-2 py-1">{tarefa.motivoImpedimento}</p>
        )}

        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {OrigemIcon && origemLabel && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-1 font-normal">
              <OrigemIcon className="h-3 w-3" />{origemLabel}
            </Badge>
          )}
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal">
            {prioridadeLabel[tarefa.prioridade]}
          </Badge>
          <StatusTag 
            label={getTaskStatusLabel(tarefa.status)} 
            variant={getTaskStatusVariant(tarefa.status)} 
          /> 
        </div>
      </CardContent>
    </Card>
  );
};
