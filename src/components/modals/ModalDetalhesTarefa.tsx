import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTarefas } from '@/hooks/useTarefas';
import { useClientes } from '@/hooks/useClientes';
import { useConsultores } from '@/hooks/useConsultores';
import { useProdutos } from '@/hooks/useProdutos';
import { useMethodology } from '@/hooks/useMethodology';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Calendar, User, Building2, Tag, Flag, Clock, X, Loader2, UserCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { TASK_STATUS_OPTIONS } from '@/constants/taskStatus';
import { ModalRegistrarImpedimento } from './ModalRegistrarImpedimento';
import type { Tarefa, StatusTarefa, TipoDemanda, NivelRisco } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  tarefa: Tarefa | null;
}

export const ModalDetalhesTarefa = ({ open, onClose, tarefa }: Props) => {
  const { upsertTarefa, deleteTarefa } = useTarefas();
  const { clientes } = useClientes();
  const { consultores } = useConsultores();
  const { produtos } = useProdutos();
  const { phases } = useMethodology();

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [consultorId, setConsultorId] = useState('');
  const [status, setStatus] = useState<StatusTarefa>('a_fazer');
  const [prioridade, setPrioridade] = useState<NivelRisco>('medio');
  const [dataVencimento, setDataVencimento] = useState('');
  const [tipo, setTipo] = useState<TipoDemanda>('consultoria');
  const [clientProductId, setClientProductId] = useState('');
  
  const [impedimentModalOpen, setImpedimentModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<StatusTarefa | null>(null);
  const [motivoImpedimento, setMotivoImpedimento] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (tarefa) {
      setTitulo(tarefa.titulo);
      setDescricao(tarefa.descricao || '');
      setClienteId(tarefa.clienteId);
      setConsultorId(tarefa.consultorId);
      setStatus(tarefa.status);
      setPrioridade(tarefa.prioridade);
      setDataVencimento(tarefa.dataVencimento || '');
      setTipo(tarefa.tipo);
      setClientProductId(tarefa.clientProductId || '');
      
      setMotivoImpedimento(tarefa.motivoImpedimento || '');
      setIsEditing(false);
      setErrors({});
    }
  }, [tarefa, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!titulo.trim()) newErrors.titulo = 'O título é obrigatório';
    if (!clienteId) newErrors.cliente = 'O cliente é obrigatório';
    if (!consultorId) newErrors.consultor = 'O responsável é obrigatório';
    if (!dataVencimento) newErrors.vencimento = 'O vencimento é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (motive?: string, overrideStatus?: StatusTarefa) => {
    if (!validate()) return;

    const isNewImpediment = !!motive;
    const effectiveStatus = overrideStatus || status;
    // Se mudou para impedida e ainda não temos motivo novo, abre modal
    if (effectiveStatus === 'impedida' && tarefa?.status !== 'impedida' && !isNewImpediment) {
      setImpedimentModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const data: any = {
        id: tarefa?.id,
        titulo,
        descricao,
        clienteId,
        consultorId,
        status: effectiveStatus,
        prioridade,
        dataVencimento,
        tipo,
        impedimentHistory: tarefa?.impedimentHistory,
        clientProductId: clientProductId === 'sem_vinculo' ? undefined : clientProductId || undefined,
        
      };
      if (isNewImpediment) {
        data.novoImpedimento = { reason: motive };
      }
      await upsertTarefa.mutateAsync(data);
      if (isNewImpediment) setMotivoImpedimento(motive!);
      setIsEditing(false);
      toast({ title: 'Sucesso', description: 'Tarefa atualizada com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDelete = async () => {
    if (!tarefa) return;
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      await deleteTarefa.mutateAsync(tarefa.id);
      onClose();
    }
  };

  if (!tarefa) return null;

  return (
    <BaseModal 
      open={open} 
      onClose={onClose} 
      titulo={isEditing ? "Editar Tarefa" : "Detalhes da Tarefa"} 
      size="xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[75vh] overflow-y-auto pr-2 py-1">
        {/* Coluna Principal: Título, Descrição, Subtarefas */}
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-1.5">
            <Label className={cn("text-xs font-semibold uppercase tracking-wider", errors.titulo ? "text-destructive" : "text-muted-foreground")}>
              Título da Tarefa {isEditing && "*"}
            </Label>
            {isEditing ? (
              <Input 
                value={titulo} 
                onChange={e => { setTitulo(e.target.value); setErrors(prev => ({ ...prev, titulo: '' })); }} 
                className={cn(errors.titulo && "border-destructive")}
              />
            ) : (
              <h2 className="text-xl font-bold text-foreground leading-tight">{tarefa.titulo}</h2>
            )}
            {errors.titulo && <p className="text-[10px] text-destructive font-medium">{errors.titulo}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição</Label>
            {isEditing ? (
              <Textarea 
                value={descricao} 
                onChange={e => setDescricao(e.target.value)} 
                rows={5}
                className="resize-none"
              />
            ) : (
              <div className="bg-muted/30 p-4 rounded-lg border border-dashed text-sm text-muted-foreground whitespace-pre-wrap min-h-[120px]">
                {tarefa.descricao || "Nenhuma descrição informada."}
              </div>
            )}
          </div>

          {Array.isArray(tarefa.impedimentHistory) && tarefa.impedimentHistory.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Histórico de Impedimentos
              </Label>
              <div className="space-y-2">
                {tarefa.impedimentHistory.map((h, idx) => (
                  <div key={idx} className="border border-destructive/20 bg-destructive/5 rounded-lg p-3 text-xs space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span><strong className="text-foreground">{h.created_by_name || 'Usuário'}</strong></span>
                      <span>{h.created_at ? format(new Date(h.created_at), "dd/MM/yyyy 'às' HH:mm") : ''}</span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{h.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Coluna Lateral: Metadados */}
        <div className="bg-muted/20 p-4 rounded-xl space-y-5 h-fit border border-muted">
          {tarefa.createdByName && (
            <div className="space-y-1.5 pb-2 border-b border-muted-foreground/10">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <User className="h-3 w-3" /> Criada por
              </Label>
              <div className="text-xs font-semibold">{tarefa.createdByName} <span className="font-normal opacity-70">({tarefa.createdByRole})</span></div>
              <div className="text-[10px] text-muted-foreground">{format(new Date(tarefa.dataCriacao), "dd/MM/yyyy 'às' HH:mm")}</div>
            </div>
          )}

          {tarefa.delegatedByName && (
            <div className="space-y-1.5 pb-2 border-b border-muted-foreground/10">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="h-3 w-3" /> Delegada por
              </Label>
              <div className="text-xs font-semibold">{tarefa.delegatedByName}</div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Status
            </Label>
            <Select 
              value={status} 
              onValueChange={(v: any) => {
                if (v === 'impedida' && status !== 'impedida') {
                  setPendingStatus(v);
                  setImpedimentModalOpen(true);
                } else {
                  setStatus(v);
                }
              }}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status === 'impedida' && (
            <div className="space-y-1.5 pt-2 border-t border-muted-foreground/10">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-destructive flex items-center gap-1.5">
                Motivo do Impedimento
              </Label>
              <div className="bg-destructive/5 p-2 rounded border border-destructive/20 text-[11px] text-destructive">
                {motivoImpedimento || "Motivo não informado"}
              </div>
              {isEditing && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-[10px] p-0 h-auto"
                  onClick={() => setImpedimentModalOpen(true)}
                >
                  Alterar Motivo
                </Button>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Flag className="h-3 w-3" /> Prioridade
            </Label>
            <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
              <SelectTrigger className="bg-background">
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

          <div className="space-y-1.5">
            <Label className={cn("text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5", errors.vencimento ? "text-destructive" : "text-muted-foreground")}>
              <Calendar className="h-3 w-3" /> Vencimento {isEditing && "*"}
            </Label>
            <Input 
              type="date" 
              value={dataVencimento} 
              onChange={e => { setDataVencimento(e.target.value); setErrors(prev => ({ ...prev, vencimento: '' })); }}
              className={cn("bg-background", errors.vencimento && "border-destructive")}
            />
          </div>

          <div className="space-y-1.5 pt-2 border-t border-muted-foreground/10">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <User className="h-3 w-3" /> Responsável {isEditing && "*"}
            </Label>
            <Select value={consultorId} onValueChange={setConsultorId}>
              <SelectTrigger className="bg-background h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(consultores || []).map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3 w-3" /> Cliente {isEditing && "*"}
            </Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger className="bg-background h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(clientes || []).map(c => <SelectItem key={c.id} value={c.id}>{c.nomeFantasia || c.razaoSocial}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Tag className="h-3 w-3" /> Tipo
            </Label>
            <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
              <SelectTrigger className="bg-background h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultoria">Consultoria</SelectItem>
                <SelectItem value="chamado">Chamado</SelectItem>
                <SelectItem value="interna">Interna</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t mt-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-destructive hover:bg-destructive/10" 
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" /> Excluir Tarefa
        </Button>

        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                Descartar
              </Button>
              <Button size="sm" onClick={() => handleSave()} disabled={isSubmitting} className="min-w-[100px]">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Alterações"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={onClose}>
                Fechar
              </Button>
              <Button size="sm" onClick={() => setIsEditing(true)}>
                Editar Tarefa
              </Button>
            </>
          )}
        </div>
      </div>

      <ModalRegistrarImpedimento
        open={impedimentModalOpen}
        onClose={() => {
          setImpedimentModalOpen(false);
          setPendingStatus(null);
        }}
        onConfirm={(reason) => {
          const newStatus = pendingStatus || 'impedida';
          if (pendingStatus) {
            setStatus(pendingStatus);
            setPendingStatus(null);
          }
          setMotivoImpedimento(reason);
          setImpedimentModalOpen(false);
          if (!isEditing) {
            handleSave(reason, newStatus);
          }
        }}
        isSubmitting={isSubmitting}
      />
    </BaseModal>
  );
};