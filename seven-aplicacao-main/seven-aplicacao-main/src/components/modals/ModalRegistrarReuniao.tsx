import { useState } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast, useToast } from '@/hooks/use-toast';
import { useReunioes } from '@/hooks/useReunioes';
import { useContratos } from '@/hooks/useContratos';
import { useMethodology } from '@/hooks/useMethodology';
import { useTarefas } from '@/hooks/useTarefas';
import { useClientProducts } from '@/hooks/useClientProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';
import { labelFase } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Sparkles, Pencil, Loader2, Plus, CheckSquare, Calendar, Clock } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  clienteId: string;
  clienteNome: string;
}

const etapas = ['Contexto', 'Evidência', 'Ata Estruturada', 'Ações'];

interface Acao {
  titulo: string;
  responsavel: string;
  prazo: string;
  subtarefas: string[];
  geradaPorIA: boolean;
}

export const ModalRegistrarReuniao = ({ open, onClose, clienteId, clienteNome }: Props) => {
  const { clientProducts } = useClientProducts(clienteId);
  const { upsertReuniao } = useReunioes();
  const { upsertTarefa } = useTarefas();
  const { phases } = useMethodology();
  const { toast } = useToast();
  
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 - Contexto
  const [contexto, setContexto] = useState({
    contractProductId: (clientProducts && clientProducts[0]?.id) || '', tipoReuniao: 'acompanhamento', data: '', faseMetodologicaId: '',
    contractProductPhaseId: '',
  });

  const { phases: productPhases } = useContractProductPhases(contexto.contractProductId);

  // Step 2 - Evidência
  const [evidencia, setEvidencia] = useState({ arquivo: '', integracaoSimulada: false });

  // Step 3 - Ata
  const [ata, setAta] = useState({ topicos: '', decisoes: '', riscos: '', resumoExecutivo: '' });
  const [iaGerada, setIaGerada] = useState(false);
  const [iaEditada, setIaEditada] = useState(false);
  const [iaGerando, setIaGerando] = useState(false);

  // Step 4 - Ações
  const [acoes, setAcoes] = useState<Acao[]>([{ titulo: '', responsavel: '', prazo: '', subtarefas: [], geradaPorIA: false }]);
  const [acoesIaGerando, setAcoesIaGerando] = useState(false);
  const [novaSubtarefa, setNovaSubtarefa] = useState<Record<number, string>>({});

  const addAcao = () => setAcoes(prev => [...prev, { titulo: '', responsavel: '', prazo: '', subtarefas: [], geradaPorIA: false }]);
  const updateAcao = (i: number, k: string, v: string) => setAcoes(prev => prev.map((a, j) => j === i ? { ...a, [k]: v } : a));

  const addSubtarefa = (i: number) => {
    const texto = novaSubtarefa[i]?.trim();
    if (!texto) return;
    setAcoes(prev => prev.map((a, j) => j === i ? { ...a, subtarefas: [...a.subtarefas, texto] } : a));
    setNovaSubtarefa(prev => ({ ...prev, [i]: '' }));
  };

  const gerarAtaIA = () => {
    setIaGerando(true);
    setTimeout(() => {
      setAta({
        topicos: '1. Revisão dos indicadores de performance do último trimestre\n2. Alinhamento sobre metas de crescimento\n3. Status das entregas pendentes do plano de ação',
        decisoes: '• Priorizar a reestruturação do funil de vendas até o próximo ciclo\n• Aprovar investimento em capacitação da equipe comercial',
        riscos: '• Atraso na entrega do relatório financeiro pode impactar o planejamento\n• Rotatividade na equipe de operações requer atenção imediata',
        resumoExecutivo: `Reunião de acompanhamento com ${clienteNome} focada na revisão de indicadores e alinhamento estratégico. Decisões tomadas sobre priorização do funil e investimento em capacitação. Dois riscos identificados requerem monitoramento.`,
      });
      setIaGerada(true);
      setIaEditada(false);
      setIaGerando(false);
    }, 1500);
  };

  const sugerirAcoesIA = () => {
    setAcoesIaGerando(true);
    setTimeout(() => {
      setAcoes([
        {
          titulo: 'Reestruturar funil de vendas',
          responsavel: 'Gestor Comercial',
          prazo: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          subtarefas: ['Mapear etapas atuais do funil', 'Identificar gargalos de conversão', 'Propor novo fluxo'],
          geradaPorIA: true,
        },
        {
          titulo: 'Plano de capacitação da equipe',
          responsavel: 'RH / Líder de equipe',
          prazo: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
          subtarefas: ['Levantar necessidades de treinamento', 'Orçar fornecedores'],
          geradaPorIA: true,
        },
        {
          titulo: 'Monitorar rotatividade operacional',
          responsavel: 'Gestor de Operações',
          prazo: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          subtarefas: ['Entrevistar colaboradores-chave'],
          geradaPorIA: true,
        },
      ]);
      setAcoesIaGerando(false);
    }, 1500);
  };

  const handleAtaChange = (field: string, value: string) => {
    setAta(p => ({ ...p, [field]: value }));
    if (iaGerada) setIaEditada(true);
  };

  const validateStep = (s: number) => {
    const newErrors: Record<string, boolean> = {};
    if (s === 0 && !contexto.data) {
      newErrors.data = true;
    }
    if (s === 2 && !ata.resumoExecutivo.trim()) {
      newErrors.resumoExecutivo = true;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    } else {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha os campos marcados com *",
        variant: "destructive"
      });
    }
  };

  const handleFinalizar = async () => {
    if (!validateStep(step)) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha os campos marcados com *",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Formata a ata completa
      const ataCompleta = `
TOPICOS:
${ata.topicos}

DECISÕES:
${ata.decisoes}

RISCOS:
${ata.riscos}

RESUMO:
${ata.resumoExecutivo}
      `.trim();

      const reuniao = await upsertReuniao.mutateAsync({
        clienteId,
        contractProductId: contexto.contractProductId,
        contractProductPhaseId: contexto.contractProductPhaseId || null,
        meetingDate: contexto.data,
        startTime: new Date().toLocaleTimeString('pt-BR', { hour12: false }).slice(0, 5),
        duracao: 60,
        tipo: contexto.tipoReuniao,
        title: ata.resumoExecutivo.slice(0, 200),
        status: 'realizada',
        ata: ataCompleta,
        
        participantes: [],
        source: 'manual'
      });

      // Cria tarefas para as ações (se houver título)
      for (const acao of acoes) {
        if (acao.titulo.trim()) {
          await upsertTarefa.mutateAsync({
            titulo: acao.titulo,
            descricao: `Ação originada na reunião de ${contexto.data}. Responsável: ${acao.responsavel}`,
            clienteId,
            clientProductId: contexto.contractProductId,
            contractProductId: contexto.contractProductId,
            contractProductPhaseId: contexto.contractProductPhaseId || null,
            status: 'a_fazer',
            prioridade: 'medio',
            dataVencimento: acao.prazo || contexto.data,
            tipo: 'consultoria',
            origem: 'reuniao'
          });
        }
      }

      onClose();
      setStep(0);
      setErrors({});
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal open={open} onClose={onClose} titulo="Registrar Reunião" descricao={`Registro de reunião — ${clienteNome}`} size="lg">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6">
        {etapas.map((e, i) => (
          <div key={e} className="flex items-center gap-1">
            <div className={cn(
              'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors cursor-pointer',
              i < step ? 'bg-seven-success text-white' : i === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )} onClick={() => setStep(i)}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className="text-xs hidden sm:inline">{e}</span>
            {i < etapas.length - 1 && <div className="w-4 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-4">
        {/* Step 1: Contexto */}
        {step === 0 && (
          <>
            {clientProducts && clientProducts.length > 0 && (
              <div className="space-y-0.5">
                <Label>Produto Contratado</Label>
                <Select value={contexto.contractProductId} onValueChange={v => setContexto(p => ({ ...p, contractProductId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{clientProducts.map(cp => <SelectItem key={cp.id} value={cp.id}>{cp.productNome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <Label>Tipo de reunião</Label>
                <Select value={contexto.tipoReuniao} onValueChange={v => setContexto(p => ({ ...p, tipoReuniao: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acompanhamento">Acompanhamento</SelectItem>
                    <SelectItem value="alinhamento">Alinhamento</SelectItem>
                    <SelectItem value="diagnostico">Diagnóstico</SelectItem>
                    <SelectItem value="emergencial">Emergencial</SelectItem>
                    <SelectItem value="checkin">Check-in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-0.5">
                <Label className={cn(errors.data && "text-destructive")}>Data *</Label>
                <div className="relative group">
                  <Input 
                    type="date" 
                    value={contexto.data} 
                    onChange={e => {
                      setContexto(p => ({ ...p, data: e.target.value }));
                      if (errors.data) setErrors(prev => ({ ...prev, data: false }));
                    }} 
                    onFocus={(e) => e.currentTarget.showPicker?.()}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className={cn(
                      "pl-9 hide-native-icon cursor-pointer relative z-0",
                      errors.data && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                </div>
              </div>
            </div>
            <div className="space-y-0.5">
              <Label>Etapa da Jornada</Label>
              <Select value={contexto.contractProductPhaseId} onValueChange={v => setContexto(p => ({ ...p, contractProductPhaseId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione a etapa..." /></SelectTrigger>
                <SelectContent>
                  {(productPhases || []).map(ph => <SelectItem key={ph.id} value={ph.id}>{ph.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              <Label>Fase metodológica</Label>
              <Select value={contexto.faseMetodologicaId} onValueChange={v => setContexto(p => ({ ...p, faseMetodologicaId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione a fase..." /></SelectTrigger>
                <SelectContent>
                  {(phases || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Step 2: Evidência */}
        {step === 1 && (
          <>
            <div className="p-4 rounded-md bg-muted/50 border text-center">
              <p className="text-sm text-muted-foreground mb-2">Integração simulada com gravação</p>
              <Button variant="outline" size="sm" onClick={() => setEvidencia(p => ({ ...p, integracaoSimulada: true }))}>
                {evidencia.integracaoSimulada ? '✓ Gravação vinculada' : 'Simular vinculação'}
              </Button>
            </div>
            <div className="space-y-0.5">
              <Label>Upload manual (obrigatório se sem integração)</Label>
              <Input type="file" onChange={e => setEvidencia(p => ({ ...p, arquivo: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Envie a gravação ou evidência da reunião.</p>
            </div>
          </>
        )}

        {/* Step 3: Ata Estruturada com IA */}
        {step === 2 && (
          <>
            {/* Bloco de geração IA */}
            <div className="p-4 rounded-md border bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Assistente IA</span>
                </div>
                {iaGerada && !iaEditada && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" /> Gerado por IA
                  </Badge>
                )}
                {iaGerada && iaEditada && (
                  <Badge variant="outline" className="gap-1">
                    <Pencil className="h-3 w-3" /> Editado manualmente
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={gerarAtaIA}
                disabled={iaGerando}
                className="w-full"
              >
                {iaGerando ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Gerando ata...</>
                ) : iaGerada ? (
                  <><Sparkles className="h-4 w-4" /> Regenerar com IA</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Gerar com IA</>
                )}
              </Button>
            </div>

            {iaGerada && (
              <p className="text-xs text-muted-foreground">Revise os campos abaixo antes de prosseguir.</p>
            )}

            <div className="space-y-0.5">
              <Label>Tópicos discutidos</Label>
              <Textarea value={ata.topicos} onChange={e => handleAtaChange('topicos', e.target.value)} placeholder="Liste os tópicos abordados..." rows={3} />
            </div>
            <div className="space-y-0.5">
              <Label>Decisões tomadas</Label>
              <Textarea value={ata.decisoes} onChange={e => handleAtaChange('decisoes', e.target.value)} placeholder="Quais decisões foram tomadas?" rows={2} />
            </div>
            <div className="space-y-0.5">
              <Label>Riscos identificados</Label>
              <Textarea value={ata.riscos} onChange={e => handleAtaChange('riscos', e.target.value)} placeholder="Riscos levantados na reunião..." rows={2} />
            </div>
            <div className="space-y-0.5">
              <Label className={cn(errors.resumoExecutivo && "text-destructive")}>Resumo executivo *</Label>
              <Textarea 
                value={ata.resumoExecutivo} 
                onChange={e => {
                  handleAtaChange('resumoExecutivo', e.target.value);
                  if (errors.resumoExecutivo) setErrors(prev => ({ ...prev, resumoExecutivo: false }));
                }} 
                placeholder="Resumo geral da reunião..." 
                rows={3} 
                className={cn(errors.resumoExecutivo && "border-destructive focus-visible:ring-destructive")}
              />
            </div>
          </>
        )}

        {/* Step 4: Ações com subtarefas e IA */}
        {step === 3 && (
          <>
            <div className="p-3 rounded-md border bg-muted/30">
              <Button
                variant="outline"
                size="sm"
                onClick={sugerirAcoesIA}
                disabled={acoesIaGerando}
                className="w-full"
              >
                {acoesIaGerando ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sugerindo ações...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Sugerir ações com IA</>
                )}
              </Button>
            </div>

            {acoes.map((a, i) => (
              <div key={i} className="p-3 rounded-md border space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">Ação {i + 1}</p>
                  {a.geradaPorIA && (
                    <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
                      <Sparkles className="h-2.5 w-2.5" /> Sugerido por IA
                    </Badge>
                  )}
                </div>
                <div className="space-y-0.5">
                  <Label>Título da ação</Label>
                  <Input value={a.titulo} onChange={e => updateAcao(i, 'titulo', e.target.value)} placeholder="Ex: Enviar relatório" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label>Responsável</Label>
                    <Input value={a.responsavel} onChange={e => updateAcao(i, 'responsavel', e.target.value)} placeholder="Nome do responsável" />
                  </div>
                  <div className="space-y-0.5">
                    <Label>Prazo</Label>
                    <div className="relative group">
                      <Input 
                        type="date" 
                        value={a.prazo} 
                        onChange={e => updateAcao(i, 'prazo', e.target.value)} 
                        onFocus={(e) => e.currentTarget.showPicker?.()}
                        onClick={(e) => e.currentTarget.showPicker?.()}
                        className="pl-9 hide-native-icon cursor-pointer relative z-0"
                      />
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    </div>
                  </div>
                </div>

                {/* Subtarefas */}
                <div className="space-y-1.5 pt-1">
                  <Label className="text-[10px]">Subtarefas</Label>
                  {a.subtarefas.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground pl-1">
                      <CheckSquare className="h-3 w-3 shrink-0" />
                      <span>{sub}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1">
                    <Input
                      value={novaSubtarefa[i] || ''}
                      onChange={e => setNovaSubtarefa(prev => ({ ...prev, [i]: e.target.value }))}
                      placeholder="Nova subtarefa..."
                      className="h-7 text-xs"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtarefa(i))}
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => addSubtarefa(i)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addAcao}>+ Adicionar ação</Button>
          </>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t mt-4">
        <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : onClose()} disabled={isSubmitting}>
          {step === 0 ? 'Cancelar' : 'Voltar'}
        </Button>
        {step < etapas.length - 1 ? (
          <Button onClick={handleNext}>Próximo</Button>
        ) : (
          <Button onClick={handleFinalizar} disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizando...</>
            ) : 'Finalizar Registro'}
          </Button>
        )}
      </div>
    </BaseModal>
  );
};
