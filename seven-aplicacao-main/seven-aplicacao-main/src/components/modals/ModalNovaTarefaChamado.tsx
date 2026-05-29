import { useState } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useClientes } from '@/hooks/useClientes';
import { useContratos } from '@/hooks/useContratos';
import { useConsultores } from '@/hooks/useConsultores';
import { useTarefas } from '@/hooks/useTarefas';
import { useAuth } from '@/contexts/AuthContext';
import { useClientProducts } from '@/hooks/useClientProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';
import { Loader2, Plus, X, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TipoDemanda, NivelRisco, StatusTarefa } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  clienteId?: string;
  clienteNome?: string;
  contractProductId?: string;
}

export const ModalNovaTarefaChamado = ({ open, onClose, clienteId, clienteNome, contractProductId: propContractProductId }: Props) => {
  const { user } = useAuth();
  const { clientes } = useClientes();
  const { contratos } = useContratos();
  const { consultores } = useConsultores();
  const { upsertTarefa } = useTarefas();

  const [tipo, setTipo] = useState<'tarefa' | 'chamado'>('tarefa');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Shared
  const [selClienteId, setSelClienteId] = useState(clienteId || '');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<NivelRisco>('medio');

  // Tarefa-specific
  const [tituloTarefa, setTituloTarefa] = useState('');
  const [prazo, setPrazo] = useState('');
  const [responsavel, setResponsavel] = useState(user?.consultorId || '');
  const [subtarefas, setSubtarefas] = useState<string[]>([]);
  const [contractProductId, setContractProductId] = useState('');
  const [contractProductPhaseId, setContractProductPhaseId] = useState('');
  // Chamado-specific
  const [assunto, setAssunto] = useState('');

  const addSubtarefa = () => setSubtarefas(prev => [...prev, '']);
  const removeSubtarefa = (index: number) => setSubtarefas(prev => prev.filter((_, i) => i !== index));

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (tipo === 'tarefa' && !tituloTarefa.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }
    
    if (tipo === 'chamado' && !assunto.trim()) {
      newErrors.assunto = 'Assunto é obrigatório';
    }
    
    if (!clienteId && !selClienteId) {
      newErrors.cliente = 'Cliente é obrigatório';
    }

    if (tipo === 'tarefa' && !prazo) {
      newErrors.prazo = 'Prazo é obrigatório';
    }

    if (tipo === 'tarefa' && !responsavel) {
      newErrors.responsavel = 'Responsável é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSalvar = async () => {
    if (!validate()) {
      toast({ 
        title: 'Campos obrigatórios', 
        description: 'Por favor, preencha todos os campos destacados.',
        variant: 'destructive' 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const novaTarefa = {
        titulo: tipo === 'tarefa' ? tituloTarefa : assunto,
        descricao,
        clienteId: selClienteId || clienteId,
        consultorId: responsavel || user?.consultorId,
        status: 'a_fazer' as StatusTarefa,
        prioridade,
        contract_product_id: contractProductId || null,
        contract_product_phase_id: contractProductPhaseId || null,
        dataVencimento: prazo || null,
        tipo: (tipo === 'chamado' ? 'chamado' : 'consultoria') as TipoDemanda,
        origem: 'gestor' as const,
        
      } as any;

      await upsertTarefa.mutateAsync(novaTarefa);
      
      // Reset form
      setTituloTarefa('');
      setAssunto('');
      setDescricao('');
      setPrazo('');
      setSubtarefas([]);
      setErrors({});
      
      onClose();
    } catch (error: any) {
      toast({ 
        title: 'Erro ao criar', 
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { clientProducts } = useClientProducts(selClienteId || clienteId);
  const { phases: productPhases } = useContractProductPhases(contractProductId);

  return (
    <BaseModal open={open} onClose={onClose} titulo="Nova Demanda" descricao="Crie uma tarefa ou abra um chamado">
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 py-1">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo da demanda *</Label>
          <Select value={tipo} onValueChange={v => { setTipo(v as any); setErrors({}); }}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tarefa">Tarefa de Consultoria</SelectItem>
              <SelectItem value="chamado">Abertura de Chamado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!clienteId && (
          <div className="space-y-1.5">
            <Label className={cn("text-xs font-semibold uppercase tracking-wider", errors.cliente ? "text-destructive" : "text-muted-foreground")}>
              Cliente *
            </Label>
            <Select value={selClienteId} onValueChange={v => { setSelClienteId(v); setErrors(prev => ({ ...prev, cliente: '' })); }}>
              <SelectTrigger className={cn("h-10", errors.cliente && "border-destructive ring-destructive")}>
                <SelectValue placeholder="Selecione o cliente..." />
              </SelectTrigger>
              <SelectContent>
                {(clientes || []).map(c => <SelectItem key={c.id} value={c.id}>{c.nomeFantasia || c.razaoSocial}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.cliente && <p className="text-[10px] text-destructive font-medium">{errors.cliente}</p>}
          </div>
        )}

        {tipo === 'tarefa' ? (
          <>
            <div className="space-y-1.5">
              <Label className={cn("text-xs font-semibold uppercase tracking-wider", errors.titulo ? "text-destructive" : "text-muted-foreground")}>
                Título da tarefa *
              </Label>
              <Input 
                value={tituloTarefa} 
                onChange={e => { setTituloTarefa(e.target.value); setErrors(prev => ({ ...prev, titulo: '' })); }} 
                placeholder="Ex: Elaborar relatório mensal de performance"
                className={cn(errors.titulo && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.titulo && <p className="text-[10px] text-destructive font-medium">{errors.titulo}</p>}
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição</Label>
              <Textarea 
                value={descricao} 
                onChange={e => setDescricao(e.target.value)} 
                placeholder="Detalhes importantes para a execução da tarefa..." 
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className={cn("text-xs font-semibold uppercase tracking-wider", errors.prazo ? "text-destructive" : "text-muted-foreground")}>
                  Prazo de Entrega *
                </Label>
                <Input 
                  type="date" 
                  value={prazo} 
                  onChange={e => { setPrazo(e.target.value); setErrors(prev => ({ ...prev, prazo: '' })); }} 
                  className={cn("h-10", errors.prazo && "border-destructive focus-visible:ring-destructive")}
                />
                {errors.prazo && <p className="text-[10px] text-destructive font-medium">{errors.prazo}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className={cn("text-xs font-semibold uppercase tracking-wider", errors.responsavel ? "text-destructive" : "text-muted-foreground")}>Responsável *</Label>
                <Select value={responsavel} onValueChange={v => { setResponsavel(v); setErrors(prev => ({ ...prev, responsavel: '' })); }}>
                  <SelectTrigger className={cn("h-10", errors.responsavel && "border-destructive ring-destructive")}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(consultores || []).map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.responsavel && <p className="text-[10px] text-destructive font-medium">{errors.responsavel}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prioridade</Label>
                <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixo">Baixa</SelectItem>
                    <SelectItem value="medio">Média</SelectItem>
                    <SelectItem value="alto">Alta</SelectItem>
                    <SelectItem value="critico">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {clientProducts && clientProducts.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Produto Contratado</Label>
                  <Select value={contractProductId} onValueChange={setContractProductId}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione o produto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientProducts.map(cp => <SelectItem key={cp.id} value={cp.id}>{cp.productNome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {productPhases && productPhases.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Etapa da Jornada</Label>
                  <Select value={contractProductPhaseId} onValueChange={setContractProductPhaseId}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione a etapa..." />
                    </SelectTrigger>
                    <SelectContent>
                      {productPhases.map(ph => <SelectItem key={ph.id} value={ph.id}>{ph.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label className={cn("text-xs font-semibold uppercase tracking-wider", errors.assunto ? "text-destructive" : "text-muted-foreground")}>
                Assunto do Chamado *
              </Label>
              <Input 
                value={assunto} 
                onChange={e => { setAssunto(e.target.value); setErrors(prev => ({ ...prev, assunto: '' })); }} 
                placeholder="Ex: Problema com acesso ao portal ou dúvida técnica"
                className={cn(errors.assunto && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.assunto && <p className="text-[10px] text-destructive font-medium">{errors.assunto}</p>}
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição do Problema</Label>
              <Textarea 
                value={descricao} 
                onChange={e => setDescricao(e.target.value)} 
                placeholder="Detalhe o ocorrido para agilizar o suporte..." 
                rows={4}
                className="resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prioridade</Label>
                <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixo">Média</SelectItem>
                    <SelectItem value="alto">Alta</SelectItem>
                    <SelectItem value="critico">Crítica / Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button onClick={handleSalvar} disabled={isSubmitting} className="min-w-[120px]">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            tipo === 'tarefa' ? 'Criar Tarefa' : 'Abrir Chamado'
          )}
        </Button>
      </div>
    </BaseModal>
  );
};