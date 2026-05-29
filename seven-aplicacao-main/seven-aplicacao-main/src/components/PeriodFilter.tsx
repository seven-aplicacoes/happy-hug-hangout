import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { PeriodoPreset, labelPreset, getPeriodo, Periodo } from '@/data/clienteIndicadores';

interface PeriodFilterProps {
  value: Periodo;
  onChange: (p: Periodo) => void;
}

const PRESETS: PeriodoPreset[] = ['7d', '30d', 'mes_atual', 'mes_anterior'];

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date | undefined>(value.preset === 'custom' ? value.from : undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(value.preset === 'custom' ? value.to : undefined);

  const aplicarCustom = () => {
    if (customFrom && customTo) {
      onChange(getPeriodo('custom', { from: customFrom, to: customTo }));
      setCustomOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PRESETS.map(p => (
        <Button
          key={p}
          size="sm"
          variant={value.preset === p ? 'default' : 'outline'}
          onClick={() => onChange(getPeriodo(p))}
          className="h-8 text-xs"
        >
          {labelPreset[p]}
        </Button>
      ))}
      <Popover open={customOpen} onOpenChange={setCustomOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={value.preset === 'custom' ? 'default' : 'outline'}
            className="h-8 text-xs"
          >
            <CalendarIcon className="h-3 w-3 mr-1.5" strokeWidth={1.5} />
            {value.preset === 'custom'
              ? `${format(value.from, 'dd/MM')} – ${format(value.to, 'dd/MM')}`
              : 'Personalizado'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="end">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="ui-overline mb-2">De</p>
                <Calendar
                  mode="single"
                  selected={customFrom}
                  onSelect={setCustomFrom}
                  locale={ptBR}
                  className={cn('p-0 pointer-events-auto')}
                />
              </div>
              <div>
                <p className="ui-overline mb-2">Até</p>
                <Calendar
                  mode="single"
                  selected={customTo}
                  onSelect={setCustomTo}
                  locale={ptBR}
                  className={cn('p-0 pointer-events-auto')}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setCustomOpen(false)}>Cancelar</Button>
              <Button size="sm" disabled={!customFrom || !customTo} onClick={aplicarCustom}>Aplicar</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
