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
import { useContratos } from '@/hooks/useContratos';
import { useContractProducts } from '@/hooks/useContractProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';
import { ModalRegistrarImpedimento } from './ModalRegistrarImpedimento';
import type { Tarefa, StatusTarefa, TipoDemanda, NivelRisco } from '@/types';

interface DefaultContext {
  clienteId?: string;
  contratoId?: string;
  contractProductId?: string;
  contractProductPhaseId?: string;
  consultorId?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  tarefa?: Tarefa | null;
  defaultContext?: DefaultContext;
}

export const ModalTarefa = ({ open, onClose, tarefa, defaultContext }: Props) => {
  const { upsertTarefa } = useTarefas();
  const { clientes } = useClientes();
  const { consultores } = useConsultores();
  const { contratos } = useContratos();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [contratoId, setContratoId] = useState('');
  const [contractProductId, setContractProductId] = useState('');
  const [contractProductPhaseId, setContractProductPhaseId] = useState('');
  const [consultorId, setConsultorId] = useState('');
  const [status, setStatus] = useState<StatusTarefa>('a_fazer');
  const [prioridade, setPrioridade] = useState<NivelRisco>('medio');
  const [dataVencimento, setDataVencimento] = useState('');
  const [tipo, setTipo] = useState<TipoDemanda>('consultoria');
  const [impedimentModalOpen, setImpedimentModalOpen] = useState(false);
  const [motivoImpedimento, setMotivoImpedimento] = useState('');
  const [pendingStatus, setPendingStatus] = useState<StatusTarefa | null>(null);

  const { products: contractProducts } = useContractProducts(contratoId);
  const { phases: productPhases } = useContractProductPhases(contractProductId);

  const contratosFiltrados = (contratos || []).filter(c => !clienteId || c.clienteId === clienteId);

  useEffect(() => {
    if (tarefa) {
      setTitulo(tarefa.titulo);
      setDescricao(tarefa.descricao);
      setClienteId(tarefa.clienteId);
      setContratoId(tarefa.contratoId || '');
      setContractProductId(tarefa.contractProductId || '');
      setContractProductPhaseId(tarefa.contractProductPhaseId || '');
      setConsultorId(tarefa.consultorId);
      setStatus(tarefa.status);
      setPrioridade(tarefa.prioridade);
      setDataVencimento(tarefa.dataVencimento);
      setTipo(tarefa.tipo);
      setMotivoImpedimento(tarefa.motivoImpedimento || '');
    } else {
      setTitulo('');
      setDescricao('');
      setClienteId(defaultContext?.clienteId || '');
      setContratoId(defaultContext?.contratoId || '');
      setContractProductId(defaultContext?.contractProductId || '');
      setContractProductPhaseId(defaultContext?.contractProductPhaseId || '');
      setConsultorId(defaultContext?.consultorId || '');
      setStatus('a_fazer');
      setPrioridade('medio');
      setDataVencimento('');
      setTipo('consultoria');
    }
  }, [tarefa, open, defaultContext]);

  const handleSave = async (motive?: string, overrideStatus?: StatusTarefa) => {
    const effectiveStatus = overrideStatus || status;
    const isNewImpediment = !!motive && (!tarefa || tarefa.status !== 'impedida' || motive !== tarefa.motivoImpedimento);

    if (effectiveStatus === 'impedida' && (!tarefa || tarefa.status !== 'impedida') && !motive) {
      setImpedimentModalOpen(true);
      return;
    }

    const data: any = {
      id: tarefa?.id,
      titulo,
      descricao,
      clienteId,
      contratoId: (contratoId === 'none' || !contratoId) ? null : contratoId,
      contractProductId: (contractProductId === 'none' || !contractProductId) ? null : contractProductId,
      contractProductPhaseId: (contractProductPhaseId === 'none' || !contractProductPhaseId) ? null : contractProductPhaseId,
      consultorId,
      status: effectiveStatus,
      prioridade,
      dataVencimento,
      tipo,
      origem: 'gestor',
      impedimentHistory: tarefa?.impedimentHistory,
    };
    if (isNewImpediment) {
      data.novoImpedimento = { reason: motive };
    }
    await upsertTarefa.mutateAsync(data);
    onClose();
  };

  const isEditMode = !!tarefa;
  const isChamado = tipo === 'chamado';
  const clienteNome = (clientes || []).find(c => c.id === clienteId)?.nomeFantasia || (clientes || []).find(c => c.id === clienteId)?.razaoSocial || '—';
  const contratoNome = (contratos || []).find(c => c.id === contratoId)?.tipo || '—';
  const produtoNome = (contractProducts || []).find(p => p.id === contractProductId)?.productNome || '—';
  const faseNome = (productPhases || []).find(p => p.id === contractProductPhaseId)?.name || '—';

  return (
    <BaseModal open={open} onClose={onClose} titulo={tarefa ? (isChamado ? "Editar Chamado" : "Editar Tarefa") : "Nova Tarefa"} size="xl">
      <div className="space-y-4 py-2">
        <div className="space-y-1">
          <Label>{isChamado ? 'Assunto do chamado *' : 'Título da tarefa *'}</Label>
          <Input value={titulo} onChange={e => setTitulo(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{isChamado ? 'Descrição do problema' : 'Descrição'}</Label>
          <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Cliente *</Label>
            <Select value={clienteId} onValueChange={v => {
              setClienteId(v);
              setContratoId('');
              setContractProductId('');
              setContractProductPhaseId('');
            }}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {(clientes || []).map(c => <SelectItem key={c.id} value={c.id}>{c.nomeFantasia || c.razaoSocial}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{isChamado ? 'Responsável pelo atendimento *' : 'Responsável pela tarefa *'}</Label>
            <Select value={consultorId} onValueChange={setConsultorId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {(consultores || []).map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!isChamado && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Contrato</Label>
                {isEditMode ? (
                  <div className="h-10 px-3 flex items-center rounded-md border bg-muted/40 text-sm text-muted-foreground">{contratoNome}</div>
                ) : (
                  <Select value={contratoId || 'none'} onValueChange={v => {
                    setContratoId(v === 'none' ? '' : v);
                    setContractProductId('');
                    setContractProductPhaseId('');
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {contratosFiltrados.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1">
                <Label>Produto contratado</Label>
                {isEditMode ? (
                  <div className="h-10 px-3 flex items-center rounded-md border bg-muted/40 text-sm text-muted-foreground">{produtoNome}</div>
                ) : (
                  <Select value={contractProductId || 'none'} onValueChange={v => {
                    setContractProductId(v === 'none' ? '' : v);
                    setContractProductPhaseId('');
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {(contractProducts || []).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.productNome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Etapa / Módulo</Label>
                {isEditMode ? (
                  <div className="h-10 px-3 flex items-center rounded-md border bg-muted/40 text-sm text-muted-foreground">{faseNome}</div>
                ) : (
                  <Select value={contractProductPhaseId || 'none'} onValueChange={v => setContractProductPhaseId(v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {(productPhases || []).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1">
                <Label>Prioridade</Label>
                <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixo">Baixa</SelectItem>
                    <SelectItem value="medio">Média</SelectItem>
                    <SelectItem value="alto">Alta</SelectItem>
                    <SelectItem value="critico">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {isChamado && (
          <div className="space-y-1">
            <Label>Prioridade</Label>
            <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="baixo">Baixa</SelectItem>
                <SelectItem value="medio">Média</SelectItem>
                <SelectItem value="alto">Alta</SelectItem>
                <SelectItem value="critico">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Vencimento *</Label>
            <Input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select 
              value={status} 
              onValueChange={(v: any) => {
                if (v === 'impedida' && status !== 'impedida' && !motivoImpedimento) {
                  setPendingStatus(v);
                  setImpedimentModalOpen(true);
                } else {
                  setStatus(v);
                }
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a_fazer">A Fazer</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="impedida">Impedida</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {status === 'impedida' && (
          <div className="space-y-1 p-3 bg-destructive/5 rounded border border-destructive/20">
            <Label className="text-destructive font-semibold">Motivo do Impedimento</Label>
            <p className="text-xs text-muted-foreground">{motivoImpedimento || "Não informado"}</p>
            <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" onClick={() => setImpedimentModalOpen(true)}>
              Alterar Motivo
            </Button>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => handleSave()}>Salvar Tarefa</Button>
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
          if (pendingStatus) setStatus(pendingStatus);
          setMotivoImpedimento(reason);
          setImpedimentModalOpen(false);
          handleSave(reason, newStatus);
        }}
      />
    </BaseModal>
  );
};