import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, setMonth, setYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { PeriodoPreset, labelPreset, getPeriodo, Periodo } from '@/data/clienteIndicadores';

interface PeriodFilterProps {
  value: Periodo;
  onChange: (p: Periodo) => void;
}

const PRESETS: PeriodoPreset[] = ['mes_atual', 'mes_anterior'];

const MONTHS = [
  { value: 0, label: 'Janeiro' },
  { value: 1, label: 'Fevereiro' },
  { value: 2, label: 'Março' },
  { value: 3, label: 'Abril' },
  { value: 4, label: 'Maio' },
  { value: 5, label: 'Junho' },
  { value: 6, label: 'Julho' },
  { value: 7, label: 'Agosto' },
  { value: 8, label: 'Setembro' },
  { value: 9, label: 'Outubro' },
  { value: 10, label: 'Novembro' },
  { value: 11, label: 'Dezembro' },
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const [customOpen, setCustomOpen] = useState(false);
  
  const [fromMonth, setFromMonth] = useState<number>(value.from.getMonth());
  const [fromYear, setFromYear] = useState<number>(value.from.getFullYear());
  const [toMonth, setToMonth] = useState<number>(value.to.getMonth());
  const [toYear, setToYear] = useState<number>(value.to.getFullYear());

  const aplicarCustom = () => {
    const fromDate = startOfMonth(setYear(setMonth(new Date(), fromMonth), fromYear));
    const toDate = endOfMonth(setYear(setMonth(new Date(), toMonth), toYear));
    
    onChange(getPeriodo('custom', { from: fromDate, to: toDate }));
    setCustomOpen(false);
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
              ? `${format(value.from, 'MMM/yy', { locale: ptBR })} – ${format(value.to, 'MMM/yy', { locale: ptBR })}`
              : 'Personalizado'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-4" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="ui-overline">De</p>
              <div className="grid grid-cols-2 gap-2">
                <Select value={fromMonth.toString()} onValueChange={(v) => setFromMonth(parseInt(v))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={fromYear.toString()} onValueChange={(v) => setFromYear(parseInt(v))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <p className="ui-overline">Até</p>
              <div className="grid grid-cols-2 gap-2">
                <Select value={toMonth.toString()} onValueChange={(v) => setToMonth(parseInt(v))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={toYear.toString()} onValueChange={(v) => setToYear(parseInt(v))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setCustomOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={aplicarCustom}>Aplicar</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}