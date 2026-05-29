import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Search, CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface DateRangeValue {
  from?: Date;
  to?: Date;
}

export interface ToggleConfig {
  key: string;
  label: string;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  dateRange?: { key: string; label: string };
  dateRangeValue?: DateRangeValue;
  onDateRangeChange?: (v: DateRangeValue) => void;
  toggles?: ToggleConfig[];
  toggleValues?: Record<string, boolean>;
  onToggleChange?: (key: string, value: boolean) => void;
  onClear?: () => void;
}

export const FilterBar = ({
  searchValue, onSearchChange, searchPlaceholder = 'Buscar...',
  filters = [], filterValues = {}, onFilterChange,
  dateRange, dateRangeValue, onDateRangeChange,
  toggles = [], toggleValues = {}, onToggleChange,
  onClear,
}: FilterBarProps) => {
  const hasActiveFilters =
    !!searchValue ||
    Object.values(filterValues).some(v => v && v !== 'todos') ||
    !!dateRangeValue?.from || !!dateRangeValue?.to ||
    Object.values(toggleValues).some(Boolean);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:flex-wrap mb-4">
      <div className="flex-1 min-w-[200px] max-w-sm space-y-0.5">
        <Label>Buscar</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
      </div>

      {filters.map((f) => (
        <div key={f.key} className="space-y-0.5">
          <Label>{f.label}</Label>
          <Select value={filterValues[f.key] || 'todos'} onValueChange={(v) => onFilterChange?.(f.key, v)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      {dateRange && (
        <div className="space-y-0.5">
          <Label>{dateRange.label}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[240px] justify-start text-left font-normal h-10',
                  !dateRangeValue?.from && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRangeValue?.from ? (
                  dateRangeValue.to ? (
                    <>
                      {format(dateRangeValue.from, 'dd/MM/yy', { locale: ptBR })} —{' '}
                      {format(dateRangeValue.to, 'dd/MM/yy', { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRangeValue.from, 'dd/MM/yy', { locale: ptBR })
                  )
                ) : (
                  <span>Selecionar período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRangeValue?.from, to: dateRangeValue?.to }}
                onSelect={(r) => onDateRangeChange?.({ from: r?.from, to: r?.to })}
                numberOfMonths={2}
                locale={ptBR}
                className={cn('p-3 pointer-events-auto')}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {toggles.map((t) => (
        <div key={t.key} className="flex items-center gap-2 h-10">
          <Switch
            id={`toggle-${t.key}`}
            checked={!!toggleValues[t.key]}
            onCheckedChange={(v) => onToggleChange?.(t.key, v)}
          />
          <Label htmlFor={`toggle-${t.key}`} className="cursor-pointer normal-case tracking-normal text-xs font-normal text-foreground">
            {t.label}
          </Label>
        </div>
      ))}

      {hasActiveFilters && onClear && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-10 self-end">
          <X className="h-4 w-4 mr-1" />Limpar
        </Button>
      )}
    </div>
  );
};
