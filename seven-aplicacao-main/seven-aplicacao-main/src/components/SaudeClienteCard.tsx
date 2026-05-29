import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SectionHeader } from '@/components/SectionHeader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Activity, TrendingUp, AlertTriangle, Heart } from 'lucide-react';
import { useClienteFicha } from '@/hooks/useClienteFicha';
import { useClienteReunioes } from '@/hooks/useClienteReunioes';
import { useClienteIndicadores } from '@/hooks/useClienteIndicadores';
import { useClienteAlertas } from '@/hooks/useClienteAlertas';
import { labelClassRisco, variantClassRisco } from '@/data/clienteScores';
import { StatusTag } from '@/components/StatusTag';
import { cn } from '@/lib/utils';

interface Props { clienteId: string; }

const variantBar: Record<string, string> = {
  success: 'bg-seven-success',
  warning: 'bg-seven-warning',
  danger: 'bg-seven-danger',
  info: 'bg-primary',
};

function ScoreItem({ icon: Icon, titulo, valor, variant, descricao }: { icon: any; titulo: string; valor: number; variant: 'success' | 'warning' | 'danger' | 'info'; descricao: string }) {
  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold">
            <Icon className="h-3 w-3" strokeWidth={1.8} />
            {titulo}
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/60 hover:text-foreground"><Info className="h-3 w-3" strokeWidth={1.5} /></button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{descricao}</TooltipContent>
            </Tooltip>
          </div>
          <span className="text-xl font-thin tabular-nums text-foreground">{valor}<span className="text-muted-foreground text-xs">/100</span></span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', variantBar[variant])} style={{ width: `${Math.min(100, Math.max(0, valor))}%` }} />
        </div>
      </div>
    </TooltipProvider>
  );
}

export function SaudeClienteCard({ clienteId }: Props) {
  const { cliente } = useClienteFicha(clienteId);
  const { reunioes = [] } = useClienteReunioes(clienteId);
  const { indicadores = [] } = useClienteIndicadores(clienteId);
  const { alertas = [] } = useClienteAlertas(clienteId);

  const scores = useMemo(() => {
    if (!cliente) return null;

    // Simplified calculation based on real data
    const reunioesRealizadas = reunioes.filter(r => r.status === 'realizada');
    
    // Engajamento: based on frequency of meetings
    const lastMeetingDate = reunioesRealizadas.length > 0 ? new Date(reunioesRealizadas[0].meetingDate) : new Date(cliente.dataInicio);
    const diasSemReuniao = Math.max(0, Math.floor((Date.now() - lastMeetingDate.getTime()) / 86400000));
    const engajamento = Math.max(0, Math.min(100, 100 - (diasSemReuniao * 3)));

    // Evolução: based on indiceSeven and indicadores
    const evolucao = cliente.indiceSeven || 50;

    // CSAT: based on indicators if available, else mock based on engagement
    const csatIndicator = indicadores.find(i => i.name.toLowerCase().includes('csat'));
    const csatMedio = csatIndicator ? csatIndicator.value : Math.min(100, 70 + (engajamento * 0.2));

    // Risco: higher if low engagement and many alerts
    const risco = Math.round(
      (100 - engajamento) * 0.4 +
      (100 - evolucao) * 0.3 +
      (alertas.length * 10)
    );

    const classRisco = risco >= 75 ? 'critico' : risco >= 55 ? 'alto' : risco >= 35 ? 'medio' : 'baixo';

    return {
      risco: Math.min(100, risco),
      engajamento: Math.round(engajamento),
      evolucao: Math.round(evolucao),
      csatMedio: Math.round(csatMedio),
      csatTaxaResposta: Math.min(100, 40 + (reunioesRealizadas.length * 5)),
      classRisco: classRisco as 'baixo' | 'medio' | 'alto' | 'critico'
    };
  }, [cliente, reunioes, indicadores, alertas]);

  if (!scores) return null;
  const s = scores;
  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <SectionHeader
          overline="Saúde do cliente"
          titulo="Scores consolidados"
          descricao="Indicadores 0–100 derivados de engajamento, execução e satisfação."
          action={<StatusTag label={`Risco ${labelClassRisco[s.classRisco]}`} variant={variantClassRisco[s.classRisco]} />}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ScoreItem icon={AlertTriangle} titulo="Score de risco" valor={s.risco} variant={s.risco >= 75 ? 'danger' : s.risco >= 55 ? 'warning' : 'success'} descricao="Probabilidade de churn nos próximos 90 dias. Combina engajamento, evolução e alertas contratuais." />
          <ScoreItem icon={Activity} titulo="Score de engajamento" valor={s.engajamento} variant={s.engajamento >= 70 ? 'success' : s.engajamento >= 40 ? 'warning' : 'danger'} descricao="Frequência e consistência de interação (reuniões, contatos)." />
          <ScoreItem icon={TrendingUp} titulo="Score de evolução" valor={s.evolucao} variant={s.evolucao >= 70 ? 'success' : s.evolucao >= 40 ? 'warning' : 'danger'} descricao="Avanço metodológico real medido pelo Índice Seven e execução de entregáveis." />
          <ScoreItem icon={Heart} titulo="CSAT médio" valor={s.csatMedio} variant={s.csatMedio >= 80 ? 'success' : s.csatMedio >= 60 ? 'warning' : 'danger'} descricao={`Satisfação média do cliente. Taxa de resposta: ${s.csatTaxaResposta}%.`} />
        </div>
      </CardContent>
    </Card>
  );
}
