import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProdutos } from '@/hooks/useProdutos';
import { useMethodology } from '@/hooks/useMethodology';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types';
import { minutesToHHMM, hhmmToMinutes, validateHHMM } from '@/lib/duration';
import { useToast } from '@/hooks/use-toast';
import { DurationInput } from '@/components/DurationInput';
import { Plus, Trash2, Loader2, ListChecks, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  open: boolean;
  onClose: () => void;
  produto?: Product | null;
}

export const ModalProduto = ({ open, onClose, produto }: Props) => {
  const { createProduto, updateProduto } = useProdutos();
  const { planPhases: allPlanPhases } = useMethodology();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [consultantHours, setConsultantHours] = useState<string>('');
  const [silvaneHours, setSilvaneHours] = useState<string>('');
  
  const [phases, setPhases] = useState<any[]>([]);
  const [phasesToDelete, setPhasesToDelete] = useState<string[]>([]);

  useEffect(() => {
    if (produto) {
      setName(produto.name);
      setDescription(produto.description || '');
      setCategory(produto.category || '');
      setStatus(produto.status);
      setConsultantHours(minutesToHHMM(produto.consultant_hours));
      setSilvaneHours(minutesToHHMM(produto.silvane_hours));
      
      const productPhases = allPlanPhases?.filter((p: any) => p.productId === produto.id) || [];
      setPhases(productPhases.map(p => ({
        id: p.id,
        name: p.name,
        orderIndex: p.orderIndex,
        durationMinutes: minutesToHHMM(p.durationMinutes),
        executorType: p.executorType || 'consultor',
        meetingsCount: p.meetingsCount || 0,
        purpose: p.purpose || ''
      })));
    } else {
      setName('');
      setDescription('');
      setCategory('');
      setStatus('ativo');
      setConsultantHours('');
      setSilvaneHours('');
      setPhases([]);
      setPhasesToDelete([]);
    }
  }, [produto, allPlanPhases]);

  const addPhase = () => {
    setPhases([...phases, { 
      name: '', 
      orderIndex: phases.length + 1, 
      durationMinutes: '', 
      executorType: 'consultor',
      meetingsCount: 0,
      purpose: '' 
    }]);
  };

  const removePhase = (index: number) => {
    const phaseToRemove = phases[index];
    if (phaseToRemove.id) {
      setPhasesToDelete([...phasesToDelete, phaseToRemove.id]);
    }
    setPhases(phases.filter((_, i) => i !== index));
  };

  const updatePhase = (index: number, field: string, value: any) => {
    const updated = [...phases];
    updated[index][field] = value;
    setPhases(updated);
  };

  const handleSave = async () => {
    // 1. Validations
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "O nome do produto é obrigatório." });
      return;
    }

    if (consultantHours && !validateHHMM(consultantHours)) {
      toast({ variant: "destructive", title: "Duração inválida", description: "O formato da Duração Consultor deve ser HH:MM" });
      return;
    }
    if (silvaneHours && !validateHHMM(silvaneHours)) {
      toast({ variant: "destructive", title: "Duração inválida", description: "O formato da Duração Silvane deve ser HH:MM" });
      return;
    }

    // Phase validations
    const orderIndices = new Set();
    let totalConsultantMinutes = 0;
    let totalSilvaneMinutes = 0;

    for (const p of phases) {
      if (!p.name.trim()) {
        toast({ variant: "destructive", title: "Módulo inválido", description: "Todos os módulos precisam de um nome." });
        return;
      }
      if (!p.durationMinutes || !validateHHMM(p.durationMinutes)) {
        toast({ variant: "destructive", title: "Módulo inválido", description: "Informe a duração do módulo no formato HH:MM." });
        return;
      }
      const pMinutes = hhmmToMinutes(p.durationMinutes) || 0;
      if (pMinutes <= 0) {
        toast({ variant: "destructive", title: "Módulo inválido", description: "A duração do módulo deve ser maior que zero." });
        return;
      }
      
      if (p.executorType === 'consultor') totalConsultantMinutes += pMinutes;
      else totalSilvaneMinutes += pMinutes;

      if (!p.orderIndex || p.orderIndex < 1) {
        toast({ variant: "destructive", title: "Módulo inválido", description: "A ordem do módulo deve ser pelo menos 1." });
        return;
      }
      if (orderIndices.has(p.orderIndex)) {
        toast({ variant: "destructive", title: "Módulo inválido", description: "Não podem existir módulos com a mesma ordem." });
        return;
      }
      orderIndices.add(p.orderIndex);
    }

    const cHoursTotal = hhmmToMinutes(consultantHours) || 0;
    const sHoursTotal = hhmmToMinutes(silvaneHours) || 0;

    if (totalConsultantMinutes > cHoursTotal) {
      toast({ variant: "destructive", title: "Limite de horas excedido", description: `Soma dos módulos de Consultor (${minutesToHHMM(totalConsultantMinutes)}) excede a duração total (${consultantHours}).` });
      return;
    }
    if (totalSilvaneMinutes > sHoursTotal) {
      toast({ variant: "destructive", title: "Limite de horas excedido", description: `Soma dos módulos de Silvane (${minutesToHHMM(totalSilvaneMinutes)}) excede a duração total (${silvaneHours}).` });
      return;
    }

    const data = { 
      name, 
      description, 
      category, 
      status,
      consultant_hours: cHoursTotal || undefined,
      silvane_hours: sHoursTotal || undefined
    };

    try {
      let productId = produto?.id;
      if (produto) {
        await updateProduto.mutateAsync({ ...data, id: produto.id });
      } else {
        const savedProd = await createProduto.mutateAsync(data);
        productId = (savedProd as any)?.[0]?.id;
      }

      if (productId) {
        // Prepare phases for saving
        const phasesToSave = phases.map(p => {
          const phase: any = {
            product_id: productId,
            name: p.name.trim(),
            order_index: Math.floor(p.orderIndex),
            duration_minutes: hhmmToMinutes(p.durationMinutes),
            executor_type: p.executorType,
            meetings_count: Math.floor(p.meetingsCount || 0),
            purpose: (p.purpose || '').trim(),
            phase_key: p.name.trim().toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, "")
          };
          
          if (p.id) {
            phase.id = p.id;
          }
          return phase;
        });

        if (phasesToSave.length > 0) {
          const { error } = await supabase
            .from('methodology_plan_phases')
            .upsert(phasesToSave);
          
          if (error) throw error;
        }

        // Handle explicit deletions
        if (phasesToDelete.length > 0) {
          const { error: delError } = await supabase
            .from('methodology_plan_phases')
            .delete()
            .in('id', phasesToDelete);
          if (delError) throw delError;
        }

        queryClient.invalidateQueries({ queryKey: ['methodology-plan-phases'] });
      }

      toast({ title: 'Sucesso', description: 'Produto e etapas salvos com sucesso.' });
      onClose();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    }
  };

  return (
    <BaseModal open={open} onClose={onClose} titulo={produto ? "Editar Produto" : "Novo Produto"} size="lg">
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 px-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Categoria</Label>
            <Input value={category} onChange={e => setCategory(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1">
          <Label>Descrição</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>Duração Consultor</Label>
            <DurationInput value={consultantHours} onChange={setConsultantHours} />
            <p className="text-[10px] text-muted-foreground">Formato: horas:minutos</p>
          </div>
          <div className="space-y-1">
            <Label>Duração Silvane</Label>
            <DurationInput value={silvaneHours} onChange={setSilvaneHours} />
            <p className="text-[10px] text-muted-foreground">Formato: horas:minutos</p>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-base font-bold flex items-center gap-2">
              <ListChecks className="h-4 w-4" /> Módulos Padrão do Produto
            </Label>
            <Button type="button" variant="outline" size="sm" onClick={addPhase} className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar Módulo
            </Button>
          </div>

          <div className="space-y-3">
            {phases.map((p, index) => (
              <Card key={index} className="bg-muted/30">
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-4 space-y-1">
                      <Label className="text-xs">Nome do Módulo *</Label>
                      <Input 
                        value={p.name} 
                        onChange={e => updatePhase(index, 'name', e.target.value)} 
                        className="h-8 text-xs"
                        placeholder="Ex: Diagnóstico Inicial"
                      />
                    </div>
                    
                    <div className="md:col-span-3 space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        <Users className="h-3 w-3" /> Responsável
                      </Label>
                      <Select 
                        value={p.executorType} 
                        onValueChange={v => updatePhase(index, 'executorType', v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consultor">Consultor</SelectItem>
                          <SelectItem value="silvane">Silvane</SelectItem>
                          <SelectItem value="cliente">Cliente</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-xs">Horas (HH:MM)</Label>
                      <Input 
                        value={p.durationMinutes} 
                        onChange={e => updatePhase(index, 'durationMinutes', e.target.value)} 
                        className="h-8 text-xs"
                        placeholder="01:00"
                      />
                    </div>

                    <div className="md:col-span-1 space-y-1">
                      <Label className="text-xs">Encontros</Label>
                      <Input 
                        type="number" 
                        value={p.meetingsCount} 
                        onChange={e => updatePhase(index, 'meetingsCount', Math.max(0, Number(e.target.value)))} 
                        className="h-8 text-xs" 
                      />
                    </div>

                    <div className="md:col-span-1 space-y-1">
                      <Label className="text-xs">Ordem</Label>
                      <Input 
                        type="number" 
                        value={p.orderIndex} 
                        onChange={e => updatePhase(index, 'orderIndex', Number(e.target.value))} 
                        className="h-8 text-xs" 
                      />
                    </div>

                    <div className="md:col-span-1 flex justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removePhase(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {phases.length === 0 && (
              <p className="text-sm text-center text-muted-foreground py-4 border-2 border-dashed rounded-lg">
                Nenhum módulo padrão definido.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Produto</Button>
        </div>
      </div>
    </BaseModal>
  );
};