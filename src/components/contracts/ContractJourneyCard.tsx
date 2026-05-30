import { 
  Briefcase, Calendar, DollarSign, Users, Loader2, Clock, CheckCircle2, Circle, 
  Pencil, Save, X, Trash2, Plus, FileText, ChevronRight, ChevronDown, 
  Download, Eye, ExternalLink, ShieldAlert, FileUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { StatusTag } from '@/components/StatusTag';
import { formatDuration, hhmmToMinutes, minutesToHHMM } from '@/lib/duration';
import { labelStatus } from '@/data/mockData';
import { useContractProducts } from '@/hooks/useContractProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';
import { useContractModuleMeetings } from '@/hooks/useContractModuleMeetings';
import { useContractModuleDocuments } from '@/hooks/useContractModuleDocuments';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConsultores } from '@/hooks/useConsultores';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModalReuniao } from '@/components/modals/ModalReuniao';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { ContractModuleMeeting, ContractModuleDocument, Reuniao } from '@/types';

interface MeetingListProps {
  phase: any;
  contrato: any;
  onSchedule: (meeting: ContractModuleMeeting) => void;
  mode?: 'admin' | 'client';
}

function MeetingList({ phase, contrato, onSchedule, mode = 'admin' }: MeetingListProps) {

  const { meetings, isLoading } = useContractModuleMeetings(phase.id);
  
  if (isLoading) return <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>;
  if (!meetings || meetings.length === 0) return <div className="p-8 text-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed my-2">Nenhum encontro configurado para este módulo.</div>;

  return (
    <div className="space-y-2 mt-4 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase text-muted-foreground">Progresso: {meetings.filter(m => m.status === 'realizada').length}/{meetings.length} encontros</span>
      </div>
      {meetings.map((meeting) => (
        <div key={meeting.id} className="group flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border bg-white hover:border-primary/40 hover:shadow-sm transition-all gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
              meeting.status === 'realizada' ? "bg-seven-success text-white" : "bg-muted text-muted-foreground"
            )}>
              #{meeting.meetingNumber}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{meeting.title}</p>
              <div className="flex items-center gap-3 mt-1">
                <StatusTag label={meeting.status} variant={meeting.status === 'realizada' ? 'success' : meeting.status === 'agendado' ? 'info' : 'neutral'} />
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

function DocumentList({ phase, contrato, type, mode = 'admin' }: { phase: any, contrato: any, type: 'internal' | 'client', mode?: 'admin' | 'client' }) {
  const { perfil, user } = useAuth();
  const { documents, isLoading, deleteDocument, downloadDocument, uploadDocument } = useContractModuleDocuments(phase.id, contrato.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const filteredDocs = documents?.filter(d => d.visibilityType === type);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadDocument.mutateAsync({
        file,
        title: file.name,
        visibilityType: type,
        clientId: contrato.clienteId,
        contractId: contrato.id,
        productId: phase.contractProductId,
        moduleId: phase.id
      });
    } catch (error) {
      console.error(error);
    }
  };

  const canDelete = (doc: ContractModuleDocument) => {
    return perfil === 'admin' || doc.uploadedBy === user?.id;
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="space-y-4 mt-4 animate-in fade-in duration-300">
      {mode === 'admin' && (
        <div className="flex justify-end">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 gap-1.5 text-xs font-bold border-dashed hover:border-primary hover:bg-primary/5"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadDocument.isPending}
          >
            {uploadDocument.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
            Upload de {type === 'internal' ? 'Material' : 'Entregável'}
          </Button>
        </div>
      )}


      {!filteredDocs || filteredDocs.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed my-2">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p>Nenhum documento {type === 'internal' ? 'interno' : 'para o cliente'} vinculado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-white hover:border-primary/40 transition-all group">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-8 w-8 rounded bg-primary/5 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[11px] font-bold text-foreground truncate">{doc.title}</p>
                  <p className="text-[10px] text-muted-foreground">{doc.fileType || 'Documento'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => downloadDocument(doc)}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
                {canDelete(doc) && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/5" onClick={() => deleteDocument.mutate(doc)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PhaseRow({ phase, contrato, isEditing, onUpdate, onDelete, onSchedule, mode = 'admin' }: { phase: any, contrato: any, isEditing?: boolean, onUpdate?: (data: any) => void, onDelete?: () => void, onSchedule: (meeting: ContractModuleMeeting) => void, mode?: 'admin' | 'client' }) {
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
                {mode === 'admin' && (
                  <TabsTrigger 
                    value="internos" 
                    className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-[11px] font-bold uppercase tracking-wider"
                  >
                    Materiais de Apoio
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="cliente" 
                  className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-[11px] font-bold uppercase tracking-wider"
                >
                  {mode === 'client' ? 'Materiais' : 'Entregáveis Cliente'}
                </TabsTrigger>

              </TabsList>
            </div>
            
            <TabsContent value="encontros" className="mt-0">
              <MeetingList phase={phase} contrato={contrato} onSchedule={onSchedule} mode={mode} />
            </TabsContent>
            {mode === 'admin' && (
              <TabsContent value="internos" className="mt-0">
                <DocumentList phase={phase} contrato={contrato} type="internal" mode={mode} />
              </TabsContent>
            )}
            <TabsContent value="cliente" className="mt-0">
              <DocumentList phase={phase} contrato={contrato} type="client" mode={mode} />
            </TabsContent>

          </Tabs>
        </div>
      )}
    </div>
  );
}

function ProductItem({ product, contrato, isEditing: isParentEditing, onSchedule, mode = 'admin' }: { product: any, contrato: any, isEditing?: boolean, onSchedule: (meeting: ContractModuleMeeting) => void, mode?: 'admin' | 'client' }) {
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
                  Duração: {formatDuration(totalMinutes)}
                </span>
              )}
              {product.productCategory && (
                <span className="text-[10px] font-bold text-muted-foreground border-l pl-4 flex items-center gap-1.5 uppercase">
                  <FileText className="h-3 w-3" />
                  {product.productCategory}
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
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        {isLoadingPhases ? (
          <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>
        ) : (
          <div className="min-w-[800px]">
            <div className="grid grid-cols-12 gap-4 py-2 px-4 bg-muted/30 border-b text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              <div className="col-span-3">Módulo</div>
              <div className="col-span-2">Executor</div>
              <div className="col-span-2">Responsável</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Duração / Enc.</div>
              <div className="col-span-1"></div>
            </div>
            {localPhases.map((phase, idx) => (
              <PhaseRow 
                key={phase.id || idx} 
                phase={phase} 
                contrato={contrato}
                isEditing={isEditing} 
                onUpdate={(data) => {
                  const newPhases = [...localPhases];
                  newPhases[idx] = data;
                  setLocalPhases(newPhases);
                }}
                onDelete={() => removeLocalPhase(idx)}
                onSchedule={onSchedule}
              />
            ))}
            {isEditing && (
              <div className="p-3 border-t bg-muted/5 flex justify-center">
                <Button variant="outline" size="sm" onClick={addPhase} className="h-8 gap-1.5 text-xs border-dashed">
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar Módulo
                </Button>
              </div>
            )}
            {(!localPhases || localPhases.length === 0) && !isEditing && (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Nenhum módulo definido para este produto.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ContractJourneyCard({ 
  contrato, 
  isEditing = false,
  expanded = false
}: { 
  contrato: any, 
  isEditing?: boolean,
  expanded?: boolean
}) {

  const { products, isLoading: isLoadingProducts } = useContractProducts(contrato.id);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [initialMeetingData, setInitialMeetingData] = useState<Partial<Reuniao> | null>(null);

  const handleScheduleMeeting = (meeting: ContractModuleMeeting) => {
    setInitialMeetingData({
      clienteId: meeting.clientId,
      contractId: meeting.contractId,
      contractProductId: meeting.productId,
      contractProductPhaseId: meeting.moduleId,
      contractModuleMeetingId: meeting.id,
      title: meeting.title,
      consultorId: meeting.consultantId || '',
      status: 'agendada'
    });
    setMeetingModalOpen(true);
  };

  if (isLoadingProducts) {
    return (
      <Card className="shadow-sm border-muted/40 overflow-hidden bg-white">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2 opacity-50" />
          <p className="text-muted-foreground text-sm font-medium">Carregando detalhes do contrato...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <AccordionItem value={contrato.id} className="border-none">
      <Card className="shadow-lg border-muted/40 overflow-hidden bg-white hover:border-primary/20 transition-all">
        <AccordionTrigger className="p-0 hover:no-underline [&[data-state=open]>div>div>div>.chevron]:rotate-180 [&>svg]:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between w-full p-6 text-left gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-lg text-foreground tracking-tight">{contrato.tipo}</h3>
                  <StatusTag label={contrato.status} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {contrato.dataInicio ? new Date(contrato.dataInicio).toLocaleDateString('pt-BR') : '-'} a {contrato.dataFim ? new Date(contrato.dataFim).toLocaleDateString('pt-BR') : '-'}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground border-l pl-4 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contrato.valor)}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground border-l pl-4 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Consultor {contrato.consultorNome}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-black px-3 py-1 text-[10px] uppercase tracking-wider">
                {products?.length || 0} Produtos
              </Badge>
              <div className="chevron transition-transform duration-200 text-muted-foreground">
                <ChevronDown className="h-5 w-5" />
              </div>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent>
          <div className="px-6 pb-8 pt-2 space-y-6">
            <div className="flex items-center gap-2 border-b border-muted/60 pb-4">
              <div className="h-6 w-1 rounded-full bg-primary" />
              <h4 className="text-sm font-black uppercase tracking-tight text-muted-foreground">Detalhamento de Produtos e Módulos</h4>
            </div>

            <div className="space-y-6">
              {(products || []).map(product => (
                <ProductItem 
                  key={product.id} 
                  product={product} 
                  contrato={contrato} 
                  isEditing={isEditing}
                  onSchedule={handleScheduleMeeting}
                />
              ))}

              {(!products || products.length === 0) && (
                <div className="p-10 text-center bg-muted/10 rounded-xl border-2 border-dashed">
                  <p className="text-muted-foreground text-sm">Nenhum produto vinculado a este contrato.</p>
                </div>
              )}
            </div>
          </div>
        </AccordionContent>
      </Card>

      <ModalReuniao 
        open={meetingModalOpen} 
        onClose={() => setMeetingModalOpen(false)} 
        initialData={initialMeetingData || undefined} 
      />
    </AccordionItem>
  );
}


