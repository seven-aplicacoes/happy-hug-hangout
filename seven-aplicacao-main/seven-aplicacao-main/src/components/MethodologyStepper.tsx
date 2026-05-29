import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { labelFase } from '@/data/mockData';
import type { FaseMetodologica } from '@/types';

const fases: FaseMetodologica[] = ['diagnostico', 'planejamento', 'estruturacao', 'monitoramento', 'encerramento'];

interface MethodologyStepperProps {
  faseAtual: FaseMetodologica;
  className?: string;
  variant?: 'full' | 'compact';
}

export const MethodologyStepper = ({ faseAtual, className, variant = 'full' }: MethodologyStepperProps) => {
  const currentIndex = fases.indexOf(faseAtual);

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 w-full', className)}>
        {/* Compact progress dots */}
        <div className="flex items-center gap-1 shrink-0">
          {fases.map((f, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <div
                key={f}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  done ? 'w-3 bg-seven-success' : active ? 'w-5 bg-primary' : 'w-1.5 bg-muted'
                )}
              />
            );
          })}
        </div>
        
        {/* Current phase label as badge */}
        <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap truncate max-w-[120px]">
          {labelFase[faseAtual]}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('w-full py-2 overflow-x-auto scrollbar-none', className)}>
      <div className="relative min-w-[500px] md:min-w-0 px-2">
        {/* Progress Line */}
        <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-muted/50 -translate-y-1/2">
          <div 
            className="h-full bg-primary transition-all duration-500 shadow-[0_0_8px_rgba(var(--primary),0.4)]" 
            style={{ width: `${(currentIndex / (fases.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps Grid - distributed 100% width */}
        <div className="flex justify-between relative z-10 w-full">
          {fases.map((f, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            
            return (
              <div key={f} className="flex flex-col items-center flex-1">
                {/* Circle */}
                <div
                  className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-full text-[11px] font-bold shrink-0 transition-all duration-300 border-2',
                    done 
                      ? 'bg-primary/20 border-primary text-primary' 
                      : active 
                        ? 'bg-primary border-primary text-primary-foreground shadow-lg scale-110 ring-4 ring-primary/10' 
                        : 'bg-background border-muted text-muted-foreground'
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </div>

                {/* Label */}
                <div className="mt-3 px-1 w-full text-center">
                  <p className={cn(
                    'text-[10px] sm:text-[11px] leading-tight transition-colors duration-300 uppercase tracking-wider',
                    active ? 'font-bold text-foreground' : 'text-muted-foreground font-medium',
                    'line-clamp-2 min-h-[2.4em]'
                  )}>
                    {labelFase[f]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};