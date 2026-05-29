import { TrendingUp, TrendingDown, Minus, Info, type LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Benchmark, BenchmarkStatus, avaliarBenchmark } from '@/data/clienteIndicadores';

const formatarBenchmarkValue = (value: number, unidade?: string) => {
  if (unidade === '%') return value.toFixed(1) + '%';
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(1);
};

interface BenchmarkBadgeProps {
  valor: number;
  bench: Benchmark;
  size?: 'sm' | 'md';
}

const ICONES: Record<BenchmarkStatus, LucideIcon> = {
  acima: TrendingUp, 
  dentro: Minus, 
  abaixo: TrendingDown,
  acima_limite: TrendingUp,
  informativo: Info
};

const CORES: Record<BenchmarkStatus, string> = {
  acima: 'text-seven-success',
  dentro: 'text-muted-foreground',
  abaixo: 'text-seven-danger',
  acima_limite: 'text-seven-danger',
  informativo: 'text-primary',
};

const LABELS: Record<BenchmarkStatus, string> = {
  acima: 'Acima do esperado',
  dentro: 'Dentro do esperado',
  abaixo: 'Abaixo do esperado',
  acima_limite: 'Acima do limite',
  informativo: 'Informativo',
};

export function BenchmarkBadge({ valor, bench, size = 'sm' }: BenchmarkBadgeProps) {
  const status = avaliarBenchmark(valor, bench);
  const Icon = ICONES[status];
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 ${CORES[status]} ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
            <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} strokeWidth={1.8} />
            <span className="uppercase tracking-wider font-medium">{LABELS[status]}</span>
            <Info className="h-2.5 w-2.5 opacity-50" strokeWidth={1.5} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px] text-xs">
          <p className="font-medium mb-1">
            {bench.is_proportional ? "Meta proporcional: " : "Meta: "}
            {formatarBenchmarkValue(bench.esperado, bench.unidade)}
          </p>
          <p className="text-muted-foreground">{bench.descricao}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
