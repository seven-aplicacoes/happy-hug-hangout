import { Briefcase, Calendar, DollarSign, Users, Loader2, Clock, CheckCircle2, Circle, Pencil, Save, X, Trash2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { StatusTag } from '@/components/StatusTag';
import { formatDuration, hhmmToMinutes, minutesToHHMM } from '@/lib/duration';
import { labelStatus } from '@/data/mockData';
import { useContractProducts } from '@/hooks/useContractProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConsultores } from '@/hooks/useConsultores';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

function MeetingDots({ total, scheduled }: { total: number; scheduled: number }) {
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="group relative">
          {i < scheduled ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-seven-success" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-muted-foreground/30" />
          )}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {i < scheduled ? 'Encontro agendado' : 'Sem agenda marcada'}
          </div>
        </div>
      ))}
      <span className="text-[10px] font-bold text-muted-foreground ml-1">
        {scheduled}/{total}
      </span>
    </div>
  );
}

function PhaseRow({ phase, isEditing, onUpdate, onDelete }: { phase: any, isEditing?: boolean, onUpdate?: (data: any) => void, onDelete?: () => void }) {
  const { consultores } = useConsultores();
  
  if (isEditing) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 py-3 border-b last:border-0 text-sm items-center px-4 bg-primary/5">
        <div className="md:col-span-3">
          <Input 
            value={phase.name} 
            onChange={e => onUpdate?.({ ...phase, name: e.target.value })}
            className="h-8 text-xs font-medium"
          />
        </div>
        <div className="md:col-span-2">
          <Select value={phase.executorType} onValueChange={v => onUpdate?.({ ...phase, executorType: v })}>
            <SelectTrigger className="h-8 text-[10px] font-semibold uppercase">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consultor">CONSULTOR</SelectItem>
              <SelectItem value="silvane">SILVANE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Select value={phase.responsibleConsultantId} onValueChange={v => onUpdate?.({ ...phase, responsibleConsultantId: v })}>
            <SelectTrigger className="h-8 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {consultores?.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Select value={phase.status} onValueChange={v => onUpdate?.({ ...phase, status: v })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(labelStatus).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <Input 
              value={minutesToHHMM(phase.durationMinutes)} 
              onChange={e => onUpdate?.({ ...phase, durationMinutes: hhmmToMinutes(e.target.value) })}
              className="h-8 text-xs w-16"
              placeholder="HH:MM"
            />
            <Input 
              type="number"
              value={phase.meetingsCount} 
              onChange={e => onUpdate?.({ ...phase, meetingsCount: Number(e.target.value) })}
              className="h-8 text-xs w-12"
              placeholder="Enc."
            />
          </div>
        </div>
        <div className="md:col-span-1 flex justify-end">
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-3 border-b last:border-0 text-sm items-center hover:bg-muted/50 transition-colors px-4">
      <div className="md:col-span-3 font-medium flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary/40 shrink-0" />
        <span className="truncate">{phase.name}</span>
      </div>
      <div className="md:col-span-2 capitalize text-[11px] font-semibold text-muted-foreground truncate">
        {phase.executorType || '-'}
      </div>
      <div className="md:col-span-2 text-xs text-muted-foreground truncate">
        {phase.responsibleConsultantNome || '-'}
      </div>
      <div className="md:col-span-2 flex justify-start">
        <StatusTag label={labelStatus[phase.status] || phase.status} />
      </div>
      <div className="md:col-span-2 flex items-center gap-1.5 text-muted-foreground text-xs tabular-nums">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        {formatDuration(phase.durationMinutes)}
      </div>
      <div className="md:col-span-1 flex justify-end">
        <MeetingDots total={phase.meetingsCount || 0} scheduled={phase.meetingsScheduled || 0} />
      </div>
    </div>
  );
}

function ProductItem({ product, isEditing: isParentEditing }: { product: any, isEditing?: boolean }) {
  const { toast } = useToast();
  const { phases: remotePhases, isLoading, upsertPhases, deletePhase } = useContractProductPhases(product.id);
  const [localPhases, setLocalPhases] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (remotePhases) {
      setLocalPhases(remotePhases);
    }
  }, [remotePhases]);

  const handleSave = async () => {
    try {
      await upsertPhases.mutateAsync(localPhases);
      setIsEditing(false);
      toast({ title: "Sucesso", description: "Jornada do produto atualizada." });
    } catch (error) {
      console.error(error);
    }
  };

  const addPhase = () => {
    const nextOrder = localPhases.length > 0 
      ? Math.max(...localPhases.map(p => p.orderIndex || 0)) + 1 
      : 1;
    setLocalPhases([...localPhases, { 
      contractProductId: product.id,
      name: 'Novo Módulo', 
      orderIndex: nextOrder, 
      durationMinutes: 60, 
      executorType: 'consultor',
      meetingsCount: 1,
      status: 'pendente'
    }]);
  };

  const removeLocalPhase = async (index: number) => {
    const phase = localPhases[index];
    if (phase.id) {
      try {
        await deletePhase.mutateAsync(phase.id);
      } catch (error) {
        console.error(error);
        return;
      }
    }
    setLocalPhases(localPhases.filter((_, i) => i !== index));
  };

  const { phases, isLoading } = useContractProductPhases(product.id);
  
  // Calculate total duration from phases if available, otherwise fallback to product snapshot hours
  const totalMinutes = localPhases && localPhases.length > 0
    ? localPhases.reduce((acc, ph) => acc + (ph.durationMinutes || 0), 0)
    : (product.consultantHours || 0) + (product.silvaneHours || 0);

  return (
    <div className="border rounded-md mb-4 overflow-hidden bg-white shadow-sm">
      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between bg-muted/30 border-b gap-3">
        <div>
          <h4 className="font-bold text-base text-foreground">{product.productNome}</h4>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {product.startDate ? new Date(product.startDate).toLocaleDateString() : '-'} a {product.endDate ? new Date(product.endDate).toLocaleDateString() : '-'}
            </span>
            {totalMinutes > 0 && (
              <span className="text-xs text-muted-foreground border-l pl-3 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Duração: {formatDuration(totalMinutes)}
              </span>
            )}
            <span className="text-xs text-muted-foreground border-l pl-3">
              Jornada de Execução
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusTag label={labelStatus[product.status] || product.status} />
          {isParentEditing && (
            isEditing ? (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setLocalPhases(remotePhases || []); setIsEditing(false); }} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={handleSave} className="h-8 gap-1.5 px-3">
                  <Save className="h-3.5 w-3.5" />
                  Salvar
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="h-8 gap-1.5 px-3">
                <Pencil className="h-3.5 w-3.5" />
                Editar Jornada
              </Button>
            )
          )}
        </div>
      </div>
      
      <div className="p-0">
      {isLoadingProducts ? (
          <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" /> <span className="text-sm text-muted-foreground">Carregando jornada...</span></div>
        ) : localPhases && localPhases.length > 0 ? (
          <div className="bg-white">
            <div className="hidden md:grid grid-cols-12 gap-4 text-[10px] font-bold text-muted-foreground uppercase py-2.5 px-4 bg-muted/20 border-b tracking-wider">
              <div className="md:col-span-3">Módulo da Jornada</div>
              <div className="md:col-span-2">Tipo</div>
              <div className="md:col-span-2">Responsável</div>
              <div className="md:col-span-2">Status</div>
              <div className="md:col-span-2">Duração / Enc.</div>
              <div className="md:col-span-1 text-right">{isEditing ? 'Ações' : 'Prog.'}</div>
            </div>
            <div className="divide-y">
              {localPhases.map((phase, idx) => (
                <PhaseRow 
                  key={phase.id || idx} 
                  phase={phase} 
                  isEditing={isEditing} 
                  onUpdate={(data) => {
                    const updated = [...localPhases];
                    updated[idx] = data;
                    setLocalPhases(updated);
                  }}
                  onDelete={() => removeLocalPhase(idx)}
                />
              ))}
              {isEditing && (
                <div className="p-2 flex justify-center bg-primary/5">
                  <Button variant="ghost" size="sm" onClick={addPhase} className="gap-2 text-primary font-bold">
                    <Plus className="h-4 w-4" /> Adicionar Módulo
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {isEditing ? (
              <Button variant="outline" onClick={addPhase} className="gap-2">
                <Plus className="h-4 w-4" /> Adicionar Primeiro Módulo
              </Button>
            ) : "Nenhuma etapa da jornada configurada para este produto."}
          </div>
        )}
      </div>
    </div>
  );
}

interface ContractJourneyCardProps {
  contrato: any;
  expanded?: boolean;
  isEditing?: boolean;
}

export const ContractJourneyCard = ({ contrato, expanded = false, isEditing = false }: ContractJourneyCardProps) => {
  const { products, isLoading: isLoadingProducts } = useContractProducts(contrato.id);
  
  const content = (
    <div className="pt-6 border-t mt-1">
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em]">Detalhamento de Produtos e Módulos</h4>
      </div>
      
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary/60" />
          <p className="text-sm text-muted-foreground">Carregando estrutura do contrato...</p>
        </div>
      ) : products && products.length > 0 ? (
        <div className="space-y-4">
          {products.map(product => <ProductItem key={product.id} product={product} isEditing={isEditing} />)}
        </div>
      ) : (
        <div className="py-12 text-center bg-muted/20 rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">Este contrato ainda não possui produtos vinculados.</p>
        </div>
      )}
    </div>
  );

  if (expanded) {
    return (
      <div className="border rounded-xl bg-white shadow-sm overflow-hidden border-muted/60 p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4 text-left w-full mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="font-bold text-lg text-foreground">{contrato.tipo}</h3>
              <StatusTag label={labelStatus[contrato.status] || contrato.status} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground mt-1.5">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(contrato.dataInicio).toLocaleDateString()} a {new Date(contrato.dataFim).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> R$ {contrato.valor?.toLocaleString('pt-BR')}</span>
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {contrato.consultorNome}</span>
            </div>
          </div>
          <div className="md:text-right shrink-0 mt-2 md:mt-0">
             <Badge variant="secondary" className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
               {products?.length || 0} Produtos
             </Badge>
          </div>
        </div>
        {content}
      </div>
    );
  }

  return (
    <AccordionItem value={contrato.id} className="border rounded-xl mb-4 bg-white shadow-sm overflow-hidden border-muted/60">
      <AccordionTrigger className="px-5 py-5 hover:no-underline hover:bg-muted/5 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center gap-4 text-left w-full pr-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="font-bold text-lg text-foreground">{contrato.tipo}</h3>
              <StatusTag label={labelStatus[contrato.status] || contrato.status} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground mt-1.5">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(contrato.dataInicio).toLocaleDateString()} a {new Date(contrato.dataFim).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> R$ {contrato.valor?.toLocaleString('pt-BR')}</span>
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {contrato.consultorNome}</span>
            </div>
          </div>
          <div className="md:text-right shrink-0 mt-2 md:mt-0">
             <Badge variant="secondary" className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
               {products?.length || 0} Produtos
             </Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-6">
        {content}
      </AccordionContent>
    </AccordionItem>
  );
};
