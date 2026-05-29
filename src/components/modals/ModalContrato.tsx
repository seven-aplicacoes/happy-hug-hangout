import { useState, useEffect, useRef } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContratos } from '@/hooks/useContratos';
import { useClientes } from '@/hooks/useClientes';
import { useConsultores } from '@/hooks/useConsultores';
import { useProdutos } from '@/hooks/useProdutos';
import { useToast } from '@/hooks/use-toast';
import { useContractProducts } from '@/hooks/useContractProducts';
import { useMethodology } from '@/hooks/useMethodology';
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Contrato, StatusContrato, NivelRisco } from '@/types';
import { addWeeks, format, parseISO, isBefore, isAfter } from 'date-fns';
import { minutesToHHMM, hhmmToMinutes, validateHHMM } from '@/lib/duration';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  contrato?: Contrato | null;
}

export const ModalContrato = ({ open, onClose, contrato }: Props) => {
  const { upsertContrato } = useContratos();
  const { toast } = useToast();
  const { clientes } = useClientes();
  const { consultores } = useConsultores();
  const { produtos } = useProdutos();
  const { planPhases } = useMethodology();
  const { products: existingProducts, upsertContractProducts } = useContractProducts(contrato?.id);

  const [clienteId, setClienteId] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [tipo, setTipo] = useState('');
  const [valor, setValor] = useState(0);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [status, setStatus] = useState<StatusContrato>('ativo');
  const [risco, setRisco] = useState<NivelRisco>('baixo');
  const [consultorId, setConsultorId] = useState('');
  
  const [contractProducts, setContractProducts] = useState<any[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<Record<number, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contrato) {
      setClienteId(contrato.clienteId);
      setContractNumber(contrato.contractNumber || '');
      setTipo(contrato.tipo);
      setValor(contrato.valor);
      setDataInicio(contrato.dataInicio);
      setDataFim(contrato.dataFim);
      setStatus(contrato.status);
      setRisco(contrato.risco);
      setConsultorId(contrato.consultorId);
      setErrors({});
    } else {
      setClienteId('');
      setContractNumber('');
      setTipo('Consultoria Recorrente');
      setValor(0);
      setDataInicio(format(new Date(), 'yyyy-MM-dd'));
      setDataFim('');
      setStatus('ativo');
      setRisco('baixo');
      setConsultorId('');
      setContractProducts([]);
      setErrors({});
    }
  }, [contrato, open]);

  useEffect(() => {
    if (existingProducts && existingProducts.length > 0) {
      const loadProductsAndPhases = async () => {
        const productsWithPhases = await Promise.all(existingProducts.map(async (p) => {
          const { data: phasesData } = await supabase
            .from('contract_product_phases')
            .select(`
              *,
              methodology_phase:methodology_plan_phases (
                duration_minutes,
                meetings_count,
                executor_type,
                name
              )
            `)
            .eq('contract_product_id', p.id)
            .order('order_index');
          
          return {
            id: p.id,
            productId: p.productId,
            productName: p.productName || p.productNome,
            productDescription: p.productDescription,
            productCategory: p.productCategory,
            consultantHours: p.consultantHours,
            silvaneHours: p.silvaneHours,
            startDate: p.startDate,
            endDate: p.endDate,
            value: p.value || 0,
            status: p.status,
            phases: (phasesData || []).map((ph: any) => ({
              id: ph.id,
              name: ph.name || ph.methodology_phase?.name,
              methodologyPhaseId: ph.methodology_phase_id,
              orderIndex: ph.order_index,
              durationMinutes: ph.duration_minutes !== null && ph.duration_minutes !== undefined ? ph.duration_minutes : (ph.methodology_phase?.duration_minutes || 0),
              executorType: ph.executor_type || ph.methodology_phase?.executor_type,
              meetingsCount: ph.meetings_count !== null && ph.meetings_count !== undefined && ph.meetings_count !== 0 ? ph.meetings_count : (ph.methodology_phase?.meetings_count || 0),
              startDate: ph.start_date,
              endDate: ph.end_date,
              responsibleConsultantId: ph.responsible_consultant_id,
              status: ph.status
            }))
          };
        }));
        setContractProducts(productsWithPhases);
      };
      loadProductsAndPhases();
    }
  }, [existingProducts]);

  const toggleProductExpand = (index: number) => {
    setExpandedProducts(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const addProduct = () => {
    const newIndex = contractProducts.length;
    setContractProducts([...contractProducts, { 
      productId: '', 
      startDate: dataInicio, 
      endDate: dataFim || addWeeks(parseISO(dataInicio), 4).toISOString().split('T')[0], 
      value: 0, 
      status: 'ativo',
      phases: []
    }]);
    setExpandedProducts(prev => ({ ...prev, [newIndex]: true }));
  };

  const removeProduct = (index: number) => {
    setContractProducts(contractProducts.filter((_, i) => i !== index));
    // Clear errors for this product
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith(`product_${index}_`) || key.startsWith(`phase_${index}_`)) {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);
  };

  const recalculateProductStages = (productStartDate: string, phases: any[]) => {
    let currentStart = productStartDate;
    return phases.map(phase => {
      if (!currentStart) return { ...phase };
      const start = currentStart;
      // Aproximação: assume 8h/dia, 5 dias/semana se não tiver durationMinutes
      const totalMinutes = phase.durationMinutes || 0;
      const daysToAdd = Math.ceil(totalMinutes / (8 * 60)) || 7; 
      const end = format(addWeeks(parseISO(start), Math.ceil(daysToAdd / 7)), 'yyyy-MM-dd');
      currentStart = end;
      return { ...phase, startDate: start, endDate: end };
    });
  };

  const updateProduct = (index: number, field: string, value: any) => {
    const updated = [...contractProducts];
    updated[index][field] = value;

    if (field === 'productId') {
      const selectedProduct = produtos?.find(p => p.id === value);
      if (selectedProduct) {
        updated[index].productName = selectedProduct.name;
        updated[index].productDescription = selectedProduct.description;
        updated[index].productCategory = selectedProduct.category;
        updated[index].consultantHours = selectedProduct.consultant_hours;
        updated[index].silvaneHours = selectedProduct.silvane_hours;
      }

      const productPhases = planPhases?.filter((pp: any) => pp.productId === value) || [];
      const defaultPhases = productPhases.map((pp: any) => ({
        name: pp.name,
        methodologyPhaseId: pp.id,
        orderIndex: pp.orderIndex,
        durationMinutes: pp.durationMinutes || 0,
        executorType: pp.executorType || 'consultor',
        meetingsCount: pp.meetingsCount || 0,
        status: 'pendente',
        responsibleConsultantId: consultorId
      }));
      
      const recalculatedPhases = recalculateProductStages(updated[index].startDate || dataInicio, defaultPhases);
      updated[index].phases = recalculatedPhases;
      
      if (recalculatedPhases.length > 0) {
        updated[index].endDate = recalculatedPhases[recalculatedPhases.length - 1].endDate;
      }
    }
    
    if (field === 'startDate') {
      const recalculatedPhases = recalculateProductStages(value, updated[index].phases);
      updated[index].phases = recalculatedPhases;
      
      if (recalculatedPhases.length > 0) {
        updated[index].endDate = recalculatedPhases[recalculatedPhases.length - 1].endDate;
      }
    }

    setContractProducts(updated);
    
    // Clear error for this field
    if (errors[`product_${index}_${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`product_${index}_${field}`];
      setErrors(newErrors);
    }
  };

  const updatePhase = (productIndex: number, phaseIndex: number, field: string, value: any) => {
    const updatedProducts = [...contractProducts];
    const phase = updatedProducts[productIndex].phases[phaseIndex];
    phase[field] = value;

    const productStartDate = updatedProducts[productIndex].startDate || dataInicio;
    const recalculatedPhases = recalculateProductStages(productStartDate, updatedProducts[productIndex].phases);
    updatedProducts[productIndex].phases = recalculatedPhases;

    if (recalculatedPhases.length > 0) {
      updatedProducts[productIndex].endDate = recalculatedPhases[recalculatedPhases.length - 1].endDate;
    }

    setContractProducts(updatedProducts);
    
    // Clear error for this field
    if (errors[`phase_${productIndex}_${phaseIndex}_${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`phase_${productIndex}_${phaseIndex}_${field}`];
      setErrors(newErrors);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!clienteId) newErrors.clienteId = 'Selecione um cliente.';
    if (!consultorId) newErrors.consultorId = 'Selecione um consultor responsável.';
    if (!tipo.trim()) newErrors.tipo = 'Informe o tipo ou nome do contrato.';
    if (!contractNumber.trim()) newErrors.contractNumber = 'Informe o código do contrato.';
    if (!dataInicio) newErrors.dataInicio = 'Informe a data de início do contrato.';
    if (!dataFim) {
      newErrors.dataFim = 'Informe a data final do contrato.';
    } else if (dataInicio && isBefore(parseISO(dataFim), parseISO(dataInicio))) {
      newErrors.dataFim = 'A data final não pode ser anterior à data de início.';
    }

    if (contractProducts.length === 0) {
      toast({ title: 'Atenção', description: 'Adicione pelo menos um produto ao contrato.', variant: 'destructive' });
      newErrors.products_empty = 'true';
    }

    contractProducts.forEach((p, pIndex) => {
      if (!p.productId) newErrors[`product_${pIndex}_productId`] = 'Selecione um produto.';
      
      if (!p.startDate) {
        newErrors[`product_${pIndex}_startDate`] = 'Informe a data de início do produto.';
      } else {
        const pStart = parseISO(p.startDate);
        if (dataInicio && isBefore(pStart, parseISO(dataInicio))) {
          newErrors[`product_${pIndex}_startDate`] = 'A data de início precisa estar dentro do período do contrato.';
        }
        if (dataFim && isAfter(pStart, parseISO(dataFim))) {
          newErrors[`product_${pIndex}_startDate`] = 'A data de início precisa estar dentro do período do contrato.';
        }
      }

      if (!p.endDate) {
        newErrors[`product_${pIndex}_endDate`] = 'Informe a data final do produto.';
      } else {
        const pEnd = parseISO(p.endDate);
        if (p.startDate && isBefore(pEnd, parseISO(p.startDate))) {
          newErrors[`product_${pIndex}_endDate`] = 'A data final não pode ser anterior à data de início.';
        }
        if (dataFim && isAfter(pEnd, parseISO(dataFim))) {
          newErrors[`product_${pIndex}_endDate`] = 'A data final precisa estar dentro do período do contrato.';
        }
      }

      if (p.value < 0) newErrors[`product_${pIndex}_value`] = 'Informe um valor válido.';

      if (p.phases.length === 0 && p.productId) {
        newErrors[`product_${pIndex}_phases_empty`] = 'O produto precisa ter pelo menos um módulo.';
      }

      p.phases.forEach((ph: any, phIndex: number) => {
        if (!ph.name.trim()) newErrors[`phase_${pIndex}_${phIndex}_name`] = 'Informe o nome do módulo.';
        if (!ph.durationMinutes || ph.durationMinutes <= 0) newErrors[`phase_${pIndex}_${phIndex}_durationMinutes`] = 'A duração precisa ser maior que zero.';
        if (!ph.responsibleConsultantId) newErrors[`phase_${pIndex}_${phIndex}_responsibleConsultantId`] = 'Selecione um responsável.';
        
        if (ph.startDate && p.startDate && isBefore(parseISO(ph.startDate), parseISO(p.startDate))) {
          newErrors[`phase_${pIndex}_${phIndex}_startDate`] = 'Data fora do período do produto.';
        }
        if (ph.endDate && p.endDate && isAfter(parseISO(ph.endDate), parseISO(p.endDate))) {
          newErrors[`phase_${pIndex}_${phIndex}_endDate`] = 'Data fora do período do produto.';
        }
      });
    });

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      toast({ title: 'Campos obrigatórios', description: 'Revise os campos obrigatórios antes de salvar.', variant: 'destructive' });
      
      // Scroll to first error
      setTimeout(() => {
        const firstErrorKey = Object.keys(newErrors)[0];
        const element = document.getElementById(`error-${firstErrorKey}`) || document.getElementsByName(firstErrorKey)[0];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      console.log('Saving contract payload:', { clienteId, tipo, contractNumber, valor, dataInicio, dataFim, status, risco, consultorId });
      
      const contractData: Partial<Contrato> = {
        id: contrato?.id || undefined,
        clienteId,
        contractNumber,
        tipo,
        valor,
        dataInicio,
        dataFim,
        status,
        risco,
        consultorId,
      };
      
      const savedContractResult = await upsertContrato.mutateAsync(contractData);
      const contractId = contrato?.id || (savedContractResult as any)?.[0]?.id;

      if (!contractId) throw new Error('Falha ao obter ID do contrato salvo.');

      console.log('Contract saved with ID:', contractId);

      // Handle deletions
      const currentProductIds = contractProducts.filter(p => p.id).map(p => p.id);
      const productsToDelete = existingProducts?.filter(p => !currentProductIds.includes(p.id)) || [];
      for (const p of productsToDelete) {
        await supabase.from('contract_products').delete().eq('id', p.id);
      }

      if (contractProducts.length > 0) {
        const productsPayload = contractProducts.map(p => {
          // Calculate totals from phases for snapshotting correctly
          const consultantHours = (p.phases || []).filter((ph: any) => 
            ph.executorType?.toLowerCase() === 'consultor'
          ).reduce((acc: number, ph: any) => acc + (Number(ph.durationMinutes) || 0), 0);
          
          const silvaneHours = (p.phases || []).filter((ph: any) => 
            ph.executorType?.toLowerCase() === 'silvane'
          ).reduce((acc: number, ph: any) => acc + (Number(ph.durationMinutes) || 0), 0);

          const payload: any = {
            contract_id: contractId,
            product_id: p.productId,
            product_name: p.productName || p.productNome,
            product_description: p.productDescription,
            product_category: p.productCategory,
            consultant_hours: consultantHours,
            silvane_hours: silvaneHours,
            start_date: p.startDate,
            end_date: p.endDate,
            value: Number(p.value) || 0,
            status: p.status || 'ativo',
            client_visible: true
          };
          if (p.id && typeof p.id === 'string' && p.id.length > 10) {
            payload.id = p.id;
          }
          return payload;
        });

        console.log('Saving contract products payload:', productsPayload);
        const { data: savedProducts, error: productsError } = await supabase
          .from('contract_products')
          .upsert(productsPayload)
          .select();

        if (productsError) throw productsError;

        for (let i = 0; i < contractProducts.length; i++) {
          const product = contractProducts[i];
          const dbProduct = (savedProducts || []).find((sp: any) => sp.product_id === product.productId);
          const cpId = product.id || dbProduct?.id;

          if (cpId) {
            const currentPhaseIds = product.phases.filter((ph: any) => ph.id).map((ph: any) => ph.id);
            const { data: existingPhases } = await supabase.from('contract_product_phases').select('id').eq('contract_product_id', cpId);
            const phasesToDelete = (existingPhases || []).filter((ph: any) => !currentPhaseIds.includes(ph.id)).map((ph: any) => ph.id);
            if (phasesToDelete.length > 0) {
              await supabase.from('contract_product_phases').delete().in('id', phasesToDelete);
            }

            if (product.phases.length > 0) {
              const phasesPayload = product.phases.map((ph: any) => {
                const phase: any = {
                  contract_product_id: cpId,
                  methodology_phase_id: ph.methodologyPhaseId,
                  order_index: ph.orderIndex,
                  name: ph.name,
                  duration_minutes: Number(ph.durationMinutes) || 0,
                  executor_type: ph.executorType,
                  meetings_count: Number(ph.meetingsCount) || 0,
                  start_date: ph.startDate,
                  end_date: ph.endDate,
                  status: ph.status || 'pendente',
                  responsible_consultant_id: ph.responsibleConsultantId,
                  client_visible: true
                };
                if (ph.id && typeof ph.id === 'string' && ph.id.length > 10) {
                  phase.id = ph.id;
                }
                return phase;
              });

              console.log(`Saving phases for product ${product.productId}:`, phasesPayload);
              const { error: phasesError } = await supabase.from('contract_product_phases').upsert(phasesPayload);
              if (phasesError) throw phasesError;
            }
          }
        }
      }

      toast({ title: 'Sucesso', description: 'Contrato e produtos salvos com sucesso.' });
      onClose();
    } catch (error: any) {
      console.error('Detailed error saving contract:', error);
      toast({ 
        title: 'Erro ao salvar', 
        description: 'Não foi possível salvar o contrato. Verifique se os produtos e etapas estão preenchidos corretamente.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ErrorMsg = ({ name }: { name: string }) => errors[name] ? (
    <p id={`error-${name}`} className="text-[10px] text-destructive flex items-center gap-1 mt-0.5 font-medium">
      <AlertCircle className="h-3 w-3" /> {errors[name]}
    </p>
  ) : null;

  return (
    <BaseModal open={open} onClose={onClose} titulo={contrato ? "Editar Contrato" : "Novo Contrato"} size="xl">
      <div ref={scrollContainerRef} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 px-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className={cn(errors.clienteId && "text-destructive")}>Cliente *</Label>
            <Select value={clienteId} onValueChange={v => { setClienteId(v); if(errors.clienteId) setErrors(prev => { const n={...prev}; delete n.clienteId; return n; }) }}>
              <SelectTrigger className={cn(errors.clienteId && "border-destructive")}><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {(clientes || []).map(c => <SelectItem key={c.id} value={c.id}>{c.nomeFantasia || c.razaoSocial}</SelectItem>)}
              </SelectContent>
            </Select>
            <ErrorMsg name="clienteId" />
          </div>
          <div className="space-y-1">
            <Label className={cn(errors.consultorId && "text-destructive")}>Consultor Responsável Geral *</Label>
            <Select value={consultorId} onValueChange={v => { setConsultorId(v); if(errors.consultorId) setErrors(prev => { const n={...prev}; delete n.consultorId; return n; }) }}>
              <SelectTrigger className={cn(errors.consultorId && "border-destructive")}><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {(consultores || []).map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <ErrorMsg name="consultorId" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className={cn(errors.tipo && "text-destructive")}>Tipo de Contrato *</Label>
            <Input 
              name="tipo"
              className={cn(errors.tipo && "border-destructive")}
              value={tipo} 
              onChange={e => { setTipo(e.target.value); if(errors.tipo) setErrors(prev => { const n={...prev}; delete n.tipo; return n; }) }} 
              placeholder="Ex: Consultoria Estratégica" 
            />
            <ErrorMsg name="tipo" />
          </div>
          <div className="space-y-1">
            <Label className={cn(errors.contractNumber && "text-destructive")}>Código/Identificação *</Label>
            <Input 
              name="contractNumber"
              className={cn(errors.contractNumber && "border-destructive")}
              value={contractNumber} 
              onChange={e => { setContractNumber(e.target.value); if(errors.contractNumber) setErrors(prev => { const n={...prev}; delete n.contractNumber; return n; }) }} 
              placeholder="Ex: CTR-2024-001" 
            />
            <ErrorMsg name="contractNumber" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className={cn(errors.valor && "text-destructive")}>Valor Total (R$)</Label>
            <Input type="number" value={valor} onChange={e => setValor(Number(e.target.value))} />
            <ErrorMsg name="valor" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className={cn(errors.dataInicio && "text-destructive")}>Data Início *</Label>
              <Input 
                type="date" 
                className={cn(errors.dataInicio && "border-destructive")}
                value={dataInicio} 
                onChange={e => { setDataInicio(e.target.value); if(errors.dataInicio) setErrors(prev => { const n={...prev}; delete n.dataInicio; return n; }) }} 
              />
              <ErrorMsg name="dataInicio" />
            </div>
            <div className="space-y-1">
              <Label className={cn(errors.dataFim && "text-destructive")}>Data Fim *</Label>
              <Input 
                type="date" 
                className={cn(errors.dataFim && "border-destructive")}
                value={dataFim} 
                onChange={e => { setDataFim(e.target.value); if(errors.dataFim) setErrors(prev => { const n={...prev}; delete n.dataFim; return n; }) }} 
              />
              <ErrorMsg name="dataFim" />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-lg font-bold">Produtos e Jornada de Execução (Módulos)</Label>
              <p className="text-xs text-muted-foreground">Vincule produtos ao contrato e defina o cronograma de módulos.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addProduct} className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar Produto
            </Button>
          </div>

          <div className="space-y-4">
            {contractProducts.map((p, pIndex) => (
              <Card key={pIndex} className={cn("border-2", (errors[`product_${pIndex}_productId`] || errors[`product_${pIndex}_startDate`] || errors[`product_${pIndex}_endDate`]) && "border-destructive")}>
                <CardContent className="p-0">
                  <div className="p-4 flex items-center justify-between bg-muted/20 border-b">
                    <div className="flex items-center gap-3 flex-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleProductExpand(pIndex)}>
                        {expandedProducts[pIndex] ? <ChevronUp /> : <ChevronDown />}
                      </Button>
                      <div className="flex-1 max-w-[300px] space-y-1">
                        <Select value={p.productId} onValueChange={v => updateProduct(pIndex, 'productId', v)}>
                          <SelectTrigger className={cn("h-9 font-medium", errors[`product_${pIndex}_productId`] && "border-destructive")}>
                            <SelectValue placeholder="Selecione o Produto..." />
                          </SelectTrigger>
                          <SelectContent>
                            {produtos?.filter(prod => prod.status === 'ativo').map(prod => (
                              <SelectItem key={prod.id} value={prod.id}>{prod.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <ErrorMsg name={`product_${pIndex}_productId`} />
                      </div>
                      <Badge variant="outline" className="bg-background">
                        {p.phases?.length || 0} Módulos
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeProduct(pIndex)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {expandedProducts[pIndex] && (
                    <div className="p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Data Início Produto *</Label>
                          <Input 
                            type="date" 
                            className={cn("h-8 text-xs", errors[`product_${pIndex}_startDate`] && "border-destructive")}
                            value={p.startDate} 
                            onChange={e => updateProduct(pIndex, 'startDate', e.target.value)} 
                          />
                          <ErrorMsg name={`product_${pIndex}_startDate`} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Data Fim Produto *</Label>
                          <Input 
                            type="date" 
                            className={cn("h-8 text-xs", errors[`product_${pIndex}_endDate`] && "border-destructive")}
                            value={p.endDate} 
                            onChange={e => updateProduct(pIndex, 'endDate', e.target.value)} 
                          />
                          <ErrorMsg name={`product_${pIndex}_endDate`} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Valor do Produto (R$)</Label>
                          <Input 
                            type="number" 
                            className={cn("h-8 text-xs", errors[`product_${pIndex}_value`] && "border-destructive")}
                            value={p.value} 
                            onChange={e => updateProduct(pIndex, 'value', Number(e.target.value))} 
                          />
                          <ErrorMsg name={`product_${pIndex}_value`} />
                        </div>
                      </div>

                      {errors[`product_${pIndex}_phases_empty`] && (
                        <div className="bg-destructive/10 p-2 rounded-md flex items-center gap-2 text-destructive text-xs">
                          <AlertCircle className="h-4 w-4" />
                          {errors[`product_${pIndex}_phases_empty`]}
                        </div>
                      )}

                      {p.phases && p.phases.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Módulos da Jornada</Label>
                          <div className="border rounded-md divide-y overflow-hidden">
                            {p.phases.map((ph: any, phIndex: number) => (
                              <div key={phIndex} className="p-3 bg-muted/5 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                <div className="md:col-span-4 space-y-1">
                                  <Label className="text-[10px]">Nome do Módulo *</Label>
                                  <Input 
                                    className={cn("h-8 text-xs", errors[`phase_${pIndex}_${phIndex}_name`] && "border-destructive")}
                                    value={ph.name} 
                                    onChange={e => updatePhase(pIndex, phIndex, 'name', e.target.value)} 
                                  />
                                  <ErrorMsg name={`phase_${pIndex}_${phIndex}_name`} />
                                </div>
                                <div className="md:col-span-1 space-y-1">
                                  <Label className="text-[10px]">Duração (Horas)</Label>
                                  <div className="flex items-center gap-1">
                                    <Input 
                                      className={cn("h-8 text-xs", errors[`phase_${pIndex}_${phIndex}_durationMinutes`] && "border-destructive")}
                                      value={minutesToHHMM(ph.durationMinutes)} 
                                      readOnly
                                    />
                                  </div>
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                  <Label className="text-[10px]">Início</Label>
                                  <Input 
                                    type="date" 
                                    className={cn("h-8 text-xs", errors[`phase_${pIndex}_${phIndex}_startDate`] && "border-destructive")}
                                    value={ph.startDate} 
                                    readOnly 
                                  />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                  <Label className="text-[10px]">Fim</Label>
                                  <Input 
                                    type="date" 
                                    className={cn("h-8 text-xs", errors[`phase_${pIndex}_${phIndex}_endDate`] && "border-destructive")}
                                    value={ph.endDate} 
                                    readOnly 
                                  />
                                </div>
                                <div className="md:col-span-3 space-y-1">
                                  <Label className="text-[10px]">Responsável *</Label>
                                  <Select value={ph.responsibleConsultantId} onValueChange={v => updatePhase(pIndex, phIndex, 'responsibleConsultantId', v)}>
                                    <SelectTrigger className={cn("h-8 text-xs", errors[`phase_${pIndex}_${phIndex}_responsibleConsultantId`] && "border-destructive")}>
                                      <SelectValue placeholder="Resp..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {consultores?.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <ErrorMsg name={`phase_${pIndex}_${phIndex}_responsibleConsultantId`} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
        <Button onClick={handleSave} disabled={isLoading} className="min-w-[140px]">
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Finalizar e Salvar"}
        </Button>
      </div>
    </BaseModal>
  );
};
