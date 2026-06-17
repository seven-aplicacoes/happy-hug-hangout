import { getFriendlyError } from '@/lib/friendlyErrors';
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
import { useContractProducts } from '@/hooks/useContractProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Calendar, User, Building2, Tag, Flag, Clock, X, Loader2, UserCheck, FileText, Briefcase, Zap, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TASK_STATUS_OPTIONS, getTaskStatusLabel, getTaskStatusVariant } from '@/constants/taskStatus';
import { ModalRegistrarImpedimento } from './ModalRegistrarImpedimento';
import { StatusTag } from '@/components/StatusTag';
import { Badge } from '@/components/ui/badge';
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

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [contractId, setContractId] = useState('');
  const [consultorId, setConsultorId] = useState('');
  const [status, setStatus] = useState<StatusTarefa>('a_fazer');
  const [prioridade, setPrioridade] = useState<NivelRisco>('medio');
  const [dataVencimento, setDataVencimento] = useState('');
  const [tipo, setTipo] = useState<TipoDemanda>('consultoria');
  const [contractProductId, setContractProductId] = useState('');
  const [contractProductPhaseId, setContractProductPhaseId] = useState('');
  
  const [impedimentModalOpen, setImpedimentModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<StatusTarefa | null>(null);
  const [motivoImpedimento, setMotivoImpedimento] = useState('');

  // Fetch contract specific options if editing
  const { products: contractProducts } = useContractProducts(contractId);
  const { phases: productPhases } = useContractProductPhases(contractProductId);

  useEffect(() => {
    if (tarefa) {
      setTitulo(tarefa.titulo);
      setDescricao(tarefa.descricao || '');
      setClienteId(tarefa.clienteId);
      setContractId(tarefa.contratoId || tarefa.contractId || '');
      setConsultorId(tarefa.consultorId);
      setStatus(tarefa.status);
      setPrioridade(tarefa.prioridade);
      setDataVencimento(tarefa.dataVencimento || '');
      setTipo(tarefa.tipo);
      setContractProductId(tarefa.contractProductId || '');
      setContractProductPhaseId(tarefa.contractProductPhaseId || '');
      
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
        contratoId: contractId,
        consultorId,
        status: effectiveStatus,
        prioridade,
        dataVencimento,
        tipo,
        impedimentHistory: tarefa?.impedimentHistory,
        contractProductId: contractProductId === 'sem_vinculo' ? null : contractProductId || null,
        contractProductPhaseId: contractProductPhaseId === 'sem_vinculo' ? null : contractProductPhaseId || null,
      };
      if (isNewImpediment) {
        data.novoImpedimento = { reason: motive };
      }
      await upsertTarefa.mutateAsync(data);
      if (isNewImpediment) setMotivoImpedimento(motive!);
      setIsEditing(false);
      toast({ title: 'Sucesso', description: 'Tarefa atualizada com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro', description: getFriendlyError(error).description, variant: 'destructive' });
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

  const footer = (
    <div className="flex items-center justify-between w-full">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-destructive hover:bg-destructive/10 font-bold" 
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4 mr-2" /> Excluir Tarefa
      </Button>

      <div className="flex gap-3">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
              Cancelar edição
            </Button>
            <Button onClick={() => handleSave()} disabled={isSubmitting} className="min-w-[140px] shadow-lg shadow-primary/20">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={() => setIsEditing(true)}>
              Editar Tarefa
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const isChamado = tarefa.tipo === 'chamado';

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      titulo={isChamado ? 'Detalhes do Chamado' : 'Detalhes da Tarefa'}
      size="2xl"
      footer={footer}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
        {/* Coluna Principal (Esquerda) */}
        <div className="md:col-span-2 space-y-8">
          {/* Badge de tipo */}
          <div>
            <Badge
              variant={isChamado ? 'destructive' : 'default'}
              className="text-[11px] px-2.5 py-0.5 h-6 font-semibold uppercase tracking-wide"
            >
              {isChamado ? 'Chamado' : 'Tarefa'}
            </Badge>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label className={cn("text-[11px] font-black uppercase tracking-widest text-muted-foreground", errors.titulo && "text-destructive")}>
              {isChamado ? 'Assunto do chamado' : 'Título da tarefa'} {isEditing && "*"}
            </Label>
            {isEditing ? (
              <Input
                value={titulo}
                onChange={e => { setTitulo(e.target.value); setErrors(prev => ({ ...prev, titulo: '' })); }}
                className={cn("text-lg font-bold h-12", errors.titulo && "border-destructive")}
                placeholder={isChamado ? 'Ex: Problema com acesso ao portal' : 'Ex: Elaborar relatório de custos'}
              />
            ) : (
              <h2 className="text-2xl font-black text-foreground tracking-tight leading-tight">{tarefa.titulo}</h2>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> {isChamado ? 'Descrição do problema' : 'Descrição'}
            </Label>
            {isEditing ? (
              <Textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                rows={6}
                className="resize-none text-sm p-4 leading-relaxed"
                placeholder="Descreva detalhadamente..."
              />
            ) : (
              <div className="bg-muted/20 p-6 rounded-xl border border-dashed text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed min-h-[150px]">
                {tarefa.descricao || "Nenhuma descrição informada."}
              </div>
            )}
          </div>

          {/* Grid de vínculos (somente leitura — não editável) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-muted">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Building2 className="h-3 w-3" /> Cliente
              </Label>
              <p className="text-sm font-bold">{tarefa.clienteNome || '—'}</p>
            </div>

            {!isChamado && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-3 w-3" /> Contrato
                  </Label>
                  <p className="text-sm font-medium text-muted-foreground">{tarefa.contratoNome || '—'}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Zap className="h-3 w-3" /> Produto
                  </Label>
                  <p className="text-sm font-medium text-muted-foreground">{tarefa.produtoNome || '—'}</p>
                </div>
              </>
            )}
          </div>

          {/* Histórico de Impedimentos (se houver) */}
          {Array.isArray(tarefa.impedimentHistory) && tarefa.impedimentHistory.length > 0 && (
            <div className="space-y-3 pt-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-destructive flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" /> Histórico de Impedimentos
              </Label>
              <div className="space-y-3">
                {tarefa.impedimentHistory.map((h, idx) => (
                  <div key={idx} className="border border-destructive/20 bg-destructive/5 rounded-xl p-4 text-xs space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-destructive/70">
                      <span>{h.created_by_name || 'Usuário'}</span>
                      <span>{h.created_at ? format(new Date(h.created_at), "dd/MM/yyyy 'às' HH:mm") : ''}</span>
                    </div>
                    <p className="text-foreground leading-relaxed">{h.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar (Direita) */}
        <div className="space-y-6">
          <div className="bg-muted/30 p-6 rounded-2xl border border-muted/60 space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-primary border-b border-primary/10 pb-2">Informações Operacionais</h4>

            {/* Criado Por */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User className="h-3 w-3" /> Criada por
              </Label>
              <div className="flex flex-col">
                <span className="text-xs font-bold">{tarefa.createdByName || 'Não informado'}</span>
                {tarefa.createdByRole && <span className="text-[9px] font-black uppercase text-muted-foreground opacity-70">{tarefa.createdByRole}</span>}
                {tarefa.dataCriacao && (
                  <span className="text-[10px] text-muted-foreground mt-1">{format(new Date(tarefa.dataCriacao), "dd/MM/yyyy 'às' HH:mm")}</span>
                )}
              </div>
            </div>

            {/* Delegada Por */}
            {tarefa.delegatedByName && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <UserCheck className="h-3 w-3" /> Delegada por
                </Label>
                <span className="text-xs font-bold">{tarefa.delegatedByName}</span>
              </div>
            )}

            {/* Responsável */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <UserCheck className="h-3 w-3" /> Responsável pela tarefa
              </Label>
              {isEditing ? (
                <Select value={consultorId} onValueChange={setConsultorId}>
                  <SelectTrigger className="bg-white h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(consultores || []).map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-xs font-bold">{tarefa.consultorNome || 'Não informado'}</span>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Clock className="h-3 w-3" /> Status
              </Label>
              {isEditing ? (
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
                  <SelectTrigger className="bg-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUS_OPTIONS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <StatusTag label={getTaskStatusLabel(tarefa.status)} variant={getTaskStatusVariant(tarefa.status)} />
              )}
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Flag className="h-3 w-3" /> Prioridade
              </Label>
              {isEditing ? (
                <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
                  <SelectTrigger className="bg-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixo">Baixa</SelectItem>
                    <SelectItem value="medio">Média</SelectItem>
                    <SelectItem value="alto">Alta</SelectItem>
                    <SelectItem value="critico">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary" className="font-bold text-[10px] uppercase">
                  {prioridade === 'critico' ? 'Crítica' : prioridade === 'alto' ? 'Alta' : prioridade === 'medio' ? 'Média' : 'Baixa'}
                </Badge>
              )}
            </div>

            {/* Vencimento */}
            <div className="space-y-2">
              <Label className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", errors.vencimento ? "text-destructive" : "text-muted-foreground")}>
                <Calendar className="h-3 w-3" /> Vencimento {isEditing && "*"}
              </Label>
              {isEditing ? (
                <Input 
                  type="date" 
                  value={dataVencimento} 
                  onChange={e => { setDataVencimento(e.target.value); setErrors(prev => ({ ...prev, vencimento: '' })); }}
                  className={cn("bg-white h-10", errors.vencimento && "border-destructive")}
                />
              ) : (
                <span className="text-xs font-bold">{tarefa.dataVencimento ? format(new Date(tarefa.dataVencimento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Sem data'}</span>
              )}
            </div>

          </div>

          {/* Se estiver no status impedida, mostra o motivo atual em destaque */}
          {status === 'impedida' && (
            <div className="bg-destructive/10 p-5 rounded-2xl border border-destructive/20 space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-destructive flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" /> Motivo Atual
              </Label>
              <p className="text-[11px] text-destructive leading-relaxed font-medium">
                {motivoImpedimento || "Motivo não informado"}
              </p>
              {isEditing && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-[10px] font-black uppercase tracking-wider text-destructive hover:bg-destructive/20 w-full"
                  onClick={() => setImpedimentModalOpen(true)}
                >
                  Alterar Motivo
                </Button>
              )}
            </div>
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