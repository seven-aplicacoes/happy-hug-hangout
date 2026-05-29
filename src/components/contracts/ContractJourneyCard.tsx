import { 
  Briefcase, Calendar, DollarSign, Users, Loader2, Clock, CheckCircle2, Circle, 
  Pencil, Save, X, Trash2, Plus, FileText, ChevronRight, ChevronDown, 
  Download, Eye, ExternalLink, ShieldAlert
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { StatusTag } from '@/components/StatusTag';
import { formatDuration, hhmmToMinutes, minutesToHHMM } from '@/lib/duration';
import { labelStatus } from '@/data/mockData';
import { useContractProducts } from '@/hooks/useContractProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';
import { useContractModuleMeetings } from '@/hooks/useContractModuleMeetings';
import { useContractModuleDocuments } from '@/hooks/useContractModuleDocuments';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConsultores } from '@/hooks/useConsultores';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModalReuniao } from '@/components/modals/ModalReuniao';
import { cn } from '@/lib/utils';
import type { ContractModuleMeeting, Documento } from '@/types';

function MeetingList({ phase, contrato, onSchedule }: { phase: any, contrato: any, onSchedule: (meeting: ContractModuleMeeting) => void }) {
  const { meetings, isLoading } = useContractModuleMeetings(phase.id);
  
  if (isLoading) return <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>;
  if (!meetings || meetings.length === 0) return <div className="p-8 text-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed my-2">Nenhum encontro configurado para este módulo.</div>;

  return (
    <div className="space-y-2 mt-4 animate-in slide-in-from-top-2 duration-300">
      {meetings.map((meeting) => (
        <div key={meeting.id} className="group flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border bg-white hover:border-primary/40 hover:shadow-sm transition-all gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
              meeting.status === 'realizado' ? "bg-seven-success text-white" : "bg-muted text-muted-foreground"
            )}>
              #{meeting.meetingNumber}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{meeting.title}</p>
              <div className="flex items-center gap-3 mt-1">
                <StatusTag label={meeting.status} variant={meeting.status === 'realizado' ? 'success' : meeting.status === 'agendado' ? 'info' : 'neutral'} />
                {meeting.scheduledAt && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {new Date(meeting.scheduledAt).toLocaleDateString('pt-BR')} às {new Date(meeting.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right mr-3 hidden md:block">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Consultor</p>
              <p className="text-[11px] font-medium">{meeting.consultantName || 'Não definido'}</p>
            </div>
            {meeting.status === 'pendente' ? (
              <Button size="sm" variant="outline" className="h-8 gap-1.5 px-3 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary" onClick={() => onSchedule(meeting)}>
                <Calendar className="h-3.5 w-3.5" /> Agendar
              </Button>
            ) : meeting.status === 'agendado' ? (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-3 text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" /> Ver reunião
                </Button>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 px-3" onClick={() => onSchedule(meeting)}>
                  Reagendar
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-3 text-seven-success font-bold bg-seven-success/5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Concluído
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentList({ phase, contrato, type }: { phase: any, contrato: any, type: 'internal' | 'client' }) {
  const { documents, isLoading } = useContractModuleDocuments(phase.id, contrato.id);
  
  const filteredDocs = documents?.filter(d => d.visibility === type || d.visibility === 'all');

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>;
  if (!filteredDocs || filteredDocs.length === 0) return (
    <div className="p-8 text-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed my-2">
      <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
      <p>Nenhum documento {type === 'internal' ? 'interno' : 'para o cliente'} vinculado.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 animate-in fade-in duration-300">
      {filteredDocs.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-white hover:border-primary/40 transition-all group">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded bg-primary/5 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-foreground truncate">{doc.titulo}</p>
              <p className="text-[10px] text-muted-foreground">{doc.tipo || 'Documento'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-primary">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PhaseRow({ phase, contrato, isEditing, onUpdate, onDelete, onSchedule }: { phase: any, contrato: any, isEditing?: boolean, onUpdate?: (data: any) => void, onDelete?: () => void, onSchedule: (meeting: ContractModuleMeeting) => void }) {
  const [expanded, setExpanded] = useState(false);
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
    <div className="border-b last:border-0 group">
      <div 
        className={cn(
          "grid grid-cols-1 md:grid-cols-12 gap-4 py-4 px-4 text-sm items-center hover:bg-primary/5 transition-all cursor-pointer relative",
          expanded && "bg-primary/5 border-l-4 border-l-primary"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="md:col-span-3 font-bold flex items-center gap-3">
          <div className={cn(
            "transition-transform duration-200",
            expanded ? "rotate-180 text-primary" : "text-muted-foreground"
          )}>
            <ChevronDown className="h-4 w-4" />
          </div>
          <span className="truncate group-hover:text-primary transition-colors">{phase.name}</span>
        </div>
        <div className="md:col-span-2 capitalize text-[10px] font-black text-muted-foreground tracking-widest truncate">
          {phase.executorType || '-'}
        </div>
        <div className="md:col-span-2 text-[11px] font-medium text-muted-foreground truncate">
          {phase.responsibleConsultantNome || '-'}
        </div>
        <div className="md:col-span-2 flex justify-start">
          <StatusTag label={labelStatus[phase.status] || phase.status} />
        </div>
        <div className="md:col-span-2 flex items-center gap-1.5 text-muted-foreground text-[11px] tabular-nums font-medium">
          <Clock className="h-3.5 w-3.5 shrink-0 opacity-40" />
          {formatDuration(phase.durationMinutes)}
        </div>
        <div className="md:col-span-1 flex justify-end">
          <div className="flex gap-1 items-center">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary/30" />
            <span className="text-[10px] font-black text-muted-foreground">{phase.meetingsScheduled || 0}/{phase.meetingsCount || 0}</span>
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="bg-primary/[0.02] px-6 pb-6 pt-2 border-t border-primary/10">
          <Tabs defaultValue="encontros" className="w-full">
            <div className="flex items-center justify-between border-b border-primary/10 pb-1 mb-2">
              <TabsList className="bg-transparent h-auto p-0 gap-6">
                <TabsTrigger 
                  value="encontros" 
                  className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-[11px] font-bold uppercase tracking-wider"
                >
                  Encontros
                </TabsTrigger>
                <TabsTrigger 
                  value="internos" 
                  className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-[11px] font-bold uppercase tracking-wider"
                >
                  Materiais de Apoio
                </TabsTrigger>
                <TabsTrigger 
                  value="cliente" 
                  className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-[11px] font-bold uppercase tracking-wider"
                >
                  Entregáveis Cliente
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="encontros" className="mt-0">
              <MeetingList phase={phase} contrato={contrato} onSchedule={onSchedule} />
            </TabsContent>
            <TabsContent value="internos" className="mt-0">
              <DocumentList phase={phase} contrato={contrato} type="internal" />
            </TabsContent>
            <TabsContent value="cliente" className="mt-0">
              <DocumentList phase={phase} contrato={contrato} type="client" />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

function ProductItem({ product, contrato, isEditing: isParentEditing, onSchedule }: { product: any, contrato: any, isEditing?: boolean, onSchedule: (meeting: ContractModuleMeeting) => void }) {
  const { toast } = useToast();
  const { phases: remotePhases, isLoading: isLoadingPhases, upsertPhases, deletePhase } = useContractProductPhases(product.id);
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

  const totalMinutes = localPhases && localPhases.length > 0
    ? localPhases.reduce((acc, ph) => acc + (ph.durationMinutes || 0), 0)
    : (product.consultantHours || 0) + (product.silvaneHours || 0);

  return (
    <div className="border rounded-xl mb-6 overflow-hidden bg-white shadow-sm border-muted/40">
      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between bg-muted/20 border-b gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
             <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-black text-base text-foreground tracking-tight">{product.productNome}</h4>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {product.startDate ? new Date(product.startDate).toLocaleDateString() : '-'} a {product.endDate ? new Date(product.endDate).toLocaleDateString() : '-'}
              </span>
              {totalMinutes > 0 && (
                <span className="text-[10px] font-bold text-muted-foreground border-l pl-4 flex items-center gap-1.5 uppercase">
                  <Clock className="h-3 w-3" />
                  {formatDuration(totalMinutes)}
                </span>
              )}
            </div>
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
                <Button size="sm" onClick={handleSave} className="h-8 gap-1.5 px-3 shadow-lg shadow-primary/10">
                  <Save className="h-3.5 w-3.5" />
                  Salvar
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="h-8 gap-1.5 px-3 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary font-bold text-[11px] uppercase tracking-wider">
                <Pencil className="h-3 w-3" />
                Editar Jornada
              </Button>
            )
          )}
        </div>
      </div>
      
      <div className="p-0">
        {isLoadingPhases ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary/60" /> 
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Carregando módulos...</span>
          </div>
        ) : localPhases && localPhases.length > 0 ? (
          <div className="bg-white">
            <div className="hidden md:grid grid-cols-12 gap-4 text-[10px] font-black text-muted-foreground uppercase py-3 px-4 bg-muted/10 border-b tracking-[0.15em]">
              <div className="md:col-span-3">Módulo da Jornada</div>
              <div className="md:col-span-2">Executor</div>
              <div className="md:col-span-2">Responsável</div>
              <div className="md:col-span-2">Status</div>
              <div className="md:col-span-2">Tempo / Enc.</div>
              <div className="md:col-span-1 text-right">{isEditing ? 'Ações' : ''}</div>
            </div>
            <div className="divide-y divide-muted/10">
              {localPhases.map((phase, idx) => (
                <PhaseRow 
                  key={phase.id || idx} 
                  phase={phase} 
                  contrato={contrato}
                  isEditing={isEditing} 
                  onSchedule={onSchedule}
                  onUpdate={(data) => {
                    const updated = [...localPhases];
                    updated[idx] = data;
                    setLocalPhases(updated);
                  }}
                  onDelete={() => removeLocalPhase(idx)}
                />
              ))}
              {isEditing && (
                <div className="p-4 flex justify-center bg-primary/5">
                  <Button variant="ghost" size="sm" onClick={addPhase} className="gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
                    <Plus className="h-4 w-4" /> Adicionar Módulo
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-muted/5">
            <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-20 text-muted-foreground" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {isEditing ? (
                <Button variant="outline" onClick={addPhase} className="gap-2 border-primary/20 text-primary">
                  <Plus className="h-4 w-4" /> Configurar Primeiro Módulo
                </Button>
              ) : "Nenhuma etapa da jornada configurada."}
            </p>
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
  const [modalOpen, setModalOpen] = useState(false);
  const [meetingToSchedule, setMeetingToSchedule] = useState<ContractModuleMeeting | null>(null);

  const handleScheduleMeeting = (meeting: ContractModuleMeeting) => {
    setMeetingToSchedule(meeting);
    setModalOpen(true);
  };
  
  const content = (
    <div className="pt-8 border-t border-muted/20 mt-2">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
           <div className="h-2 w-2 rounded-full bg-primary" />
           <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Estrutura da Jornada de Valor</h4>
        </div>
      </div>
      
      {isLoadingProducts ? (
        <div className="py-20 text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary/40" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Reconstruindo jornada...</p>
        </div>
      ) : products && products.length > 0 ? (
        <div className="space-y-2">
          {products.map(product => (
            <ProductItem 
              key={product.id} 
              product={product} 
              contrato={contrato} 
              isEditing={isEditing} 
              onSchedule={handleScheduleMeeting}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-muted/10 rounded-2xl border-2 border-dashed border-muted/20">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-10" />
          <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em]">Este contrato ainda não possui produtos vinculados.</p>
        </div>
      )}

      {modalOpen && (
        <ModalReuniao 
          open={modalOpen} 
          onClose={() => {
            setModalOpen(false);
            setMeetingToSchedule(null);
          }} 
          initialData={meetingToSchedule ? {
            title: meetingToSchedule.title,
            clienteId: contrato.clienteId,
            contractId: contrato.id,
            contractProductId: meetingToSchedule.contractProductId,
            contractProductPhaseId: meetingToSchedule.moduleId,
            contractModuleMeetingId: meetingToSchedule.id,
            consultorId: contrato.consultorId,
            tipo: 'Check-in Semanal',
            status: 'agendada'
          } : undefined}
        />
      )}
    </div>
  );

  if (expanded) {
    return (
      <div className="border rounded-2xl bg-white shadow-xl overflow-hidden border-muted/30 p-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col md:flex-row md:items-center gap-6 text-left w-full mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center shrink-0">
            <Briefcase className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-3">
              <h3 className="font-black text-2xl text-foreground tracking-tight">{contrato.tipo}</h3>
              <StatusTag label={labelStatus[contrato.status] || contrato.status} />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs font-medium text-muted-foreground mt-2">
              <span className="flex items-center gap-2"><Calendar className="h-4 w-4 opacity-40" /> {new Date(contrato.dataInicio).toLocaleDateString('pt-BR')} a {new Date(contrato.dataFim).toLocaleDateString('pt-BR')}</span>
              <span className="flex items-center gap-2"><DollarSign className="h-4 w-4 opacity-40" /> R$ {contrato.valor?.toLocaleString('pt-BR')}</span>
              <span className="flex items-center gap-2"><Users className="h-4 w-4 opacity-40" /> {contrato.consultorNome}</span>
            </div>
          </div>
          <div className="md:text-right shrink-0">
             <Badge className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-sm">
               {products?.length || 0} Produtos em Execução
             </Badge>
          </div>
        </div>
        {content}
      </div>
    );
  }

  return (
    <AccordionItem value={contrato.id} className="border rounded-2xl mb-6 bg-white shadow-lg overflow-hidden border-muted/30 group transition-all duration-300 hover:shadow-xl hover:border-primary/20">
      <AccordionTrigger className="px-6 py-6 hover:no-underline hover:bg-primary/[0.02] transition-colors">
        <div className="flex flex-col md:flex-row md:items-center gap-6 text-left w-full pr-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-500">
            <Briefcase className="h-7 w-7 text-primary group-hover:text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-3">
              <h3 className="font-black text-xl text-foreground tracking-tight group-hover:text-primary transition-colors">{contrato.tipo}</h3>
              <StatusTag label={labelStatus[contrato.status] || contrato.status} />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs font-medium text-muted-foreground mt-2">
              <span className="flex items-center gap-2 uppercase tracking-wider text-[10px] font-bold"><Calendar className="h-3.5 w-3.5 opacity-40" /> {new Date(contrato.dataInicio).toLocaleDateString('pt-BR')}</span>
              <span className="flex items-center gap-2 uppercase tracking-wider text-[10px] font-bold"><Users className="h-3.5 w-3.5 opacity-40" /> {contrato.consultorNome}</span>
            </div>
          </div>
          <div className="md:text-right shrink-0">
             <Badge variant="secondary" className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-muted/30">
               {products?.length || 0} Produtos
             </Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-8">
        {content}
      </AccordionContent>
    </AccordionItem>
  );
};
