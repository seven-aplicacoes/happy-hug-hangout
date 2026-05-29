import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Sparkles, CheckCircle, Pencil, Clock, FileText, Paperclip } from 'lucide-react';

interface TimelineCardProps {
  data: string;
  tipo: string;
  titulo: string;
  descricao: string;
  status?: string;
  ataLabel?: string;
  resumoIA?: string;
  statusResumo?: 'gerado_ia' | 'revisado' | 'editado_manualmente' | 'pendente';
  contratoVinculado?: string;
  evidencias?: string[];
  tarefasGeradas?: string[];
  faseRelacionada?: string;
  onAction?: () => void;
  isLast?: boolean;
}

const tipoConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  reuniao: { label: 'Reunião de Acompanhamento', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-500' },
  tarefa: { label: 'Tarefa', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', dot: 'bg-yellow-500' },
  chamado: { label: 'Chamado', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', dot: 'bg-red-500' },
  documento: { label: 'Documento', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', dot: 'bg-blue-500' },
  marco: { label: 'Marco', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', dot: 'bg-green-500' },
  relatorio: { label: 'Relatório', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-300', dot: 'bg-indigo-500' },
  status_change: { label: 'Mudança de Status', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', dot: 'bg-orange-500' },
  bloqueio: { label: 'Bloqueio/Desbloqueio', bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-800 dark:text-rose-300', dot: 'bg-rose-500' },
  alteracao_contratual: { label: 'Alteração Contratual', bg: 'bg-slate-100 dark:bg-slate-900/30', text: 'text-slate-800 dark:text-slate-300', dot: 'bg-slate-500' },
  conquista: { label: 'Conquista', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500' },
};

const resumoStatusConfig: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  gerado_ia: { label: 'Gerado por IA', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300', icon: Sparkles },
  revisado: { label: 'Revisado', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: CheckCircle },
  editado_manualmente: { label: 'Editado manualmente', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', icon: Pencil },
  pendente: { label: 'Pendente de revisão', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', icon: Clock },
};

function formatDatePt(dateStr: string) {
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const [year, month, day] = dateStr.split('-');
  const d = parseInt(day, 10);
  const m = meses[parseInt(month, 10) - 1] || month;
  return { dia: `${d} de ${m}`, ano: year };
}

export const TimelineCard = ({ data, tipo, titulo, descricao, resumoIA, statusResumo, contratoVinculado, evidencias, tarefasGeradas, faseRelacionada, ataLabel, onAction, isLast = false }: TimelineCardProps) => {
  const config = tipoConfig[tipo] || { label: tipo, bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' };
  const resumoConfig = statusResumo ? resumoStatusConfig[statusResumo] : null;
  const { dia, ano } = formatDatePt(data);

  const hasMetadata = contratoVinculado || faseRelacionada || (tarefasGeradas && tarefasGeradas.length > 0) || (evidencias && evidencias.length > 0);

  return (
    <div className="flex gap-5">
      {/* Coluna esquerda — data */}
      <div className="w-28 shrink-0 text-right pt-1">
        <p className="text-sm font-medium text-foreground leading-tight">{dia}</p>
        <p className="text-xs text-muted-foreground">{ano}</p>
      </div>

      {/* Coluna central — dot + linha */}
      <div className="flex flex-col items-center">
        <div className={cn('h-3.5 w-3.5 rounded-full mt-1.5 shrink-0 ring-4 ring-background', config.dot)} />
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>

      {/* Coluna direita — card */}
      <div className="flex-1 pb-8">
        <div className="bg-muted/60 rounded-lg p-5 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn('border-0 font-medium', config.bg, config.text)}>{config.label}</Badge>
            {resumoConfig && (
              <Badge className={cn('border-0 font-medium gap-1', resumoConfig.bg, resumoConfig.text)}>
                <resumoConfig.icon className="h-3 w-3" />
                {resumoConfig.label}
              </Badge>
            )}
            {ataLabel && (
              <span className="text-xs text-muted-foreground">📄 {ataLabel}</span>
            )}
          </div>
          <p className="text-base font-semibold text-foreground">{titulo}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{descricao}</p>

          {/* Metadados enriquecidos */}
          {hasMetadata && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {contratoVinculado && (
                <Badge variant="outline" className="gap-1 text-xs font-normal">
                  <FileText className="h-3 w-3" />
                  {contratoVinculado}
                </Badge>
              )}
              {faseRelacionada && (
                <Badge variant="outline" className="text-xs font-normal">
                  {faseRelacionada}
                </Badge>
              )}
              {evidencias && evidencias.length > 0 && evidencias.map((ev, i) => (
                <Badge key={i} variant="outline" className="gap-1 text-xs font-normal">
                  <Paperclip className="h-3 w-3" />
                  {ev}
                </Badge>
              ))}
            </div>
          )}

          {/* Tarefas geradas */}
          {tarefasGeradas && tarefasGeradas.length > 0 && (
            <div className="pt-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">Tarefas geradas:</p>
              <ul className="text-sm text-muted-foreground space-y-0.5">
                {tarefasGeradas.map((t, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resumoIA && (
            <div className="bg-background/80 rounded-md p-3 mt-1">
              <p className="text-sm text-foreground">
                <span className="font-medium">Resumo IA:</span>{' '}
                <span className="text-muted-foreground">{resumoIA}</span>
              </p>
            </div>
          )}
          {onAction && (
            <button
              onClick={onAction}
              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1 pt-1"
            >
              Ler Ata Completa <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
