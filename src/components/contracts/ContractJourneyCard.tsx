import { 
  Briefcase, Calendar, DollarSign, Users, Loader2, Clock, CheckCircle2, Circle, 
  Pencil, Save, X, Trash2, Plus, FileText, ChevronRight, ChevronDown, 
  Download, Eye, ExternalLink, ShieldAlert, FileUp, Settings, Trash, Info, CalendarClock, AlertCircle
} from 'lucide-react';
import { useConsultantAvailability } from '@/hooks/useConsultantAvailability';
import { ModalAgendamentoCliente } from '@/components/modals/ModalAgendamentoCliente';
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
import { useCalendlyLink } from '@/hooks/useCalendlyLink';
import { CalendlyModal } from '@/components/modals/CalendlyModal';
import type { ContractModuleMeeting, ContractModuleDocument, Reuniao } from '@/types';



interface MeetingListProps {
  phase: any;
  contrato: any;
  mode?: 'admin' | 'client' | 'consultor';
}


function MeetingRow({ 
  meeting, 
  isLocked, 
  mode, 
  onSchedule, 
  onCancel, 
  onToggleAvailability, 
  showAvailability 
}: { 
  meeting: ContractModuleMeeting, 
  isLocked: boolean, 
  mode: string, 
  onSchedule: (m: ContractModuleMeeting) => void,
  onCancel: (id: string) => void,
  onToggleAvailability: (id: string) => void,
  showAvailability: boolean
}) {
  const isCompleted = ['realizada', 'concluida', 'concluído', 'concluída', 'resolvido', 'completed', 'done'].includes(meeting.status.toLowerCase());
  const [calendlyModalOpen, setCalendlyModalOpen] = useState(false);
  const { user } = useAuth();
  
  const { data: calendlyUrl } = useCalendlyLink({
    consultantId: meeting.consultantId || '',
    moduleId: meeting.moduleId,
    productId: meeting.productId,
  });

  const now = new Date();
  const isOutsideWindow = (meeting.availableFrom && now < new Date(meeting.availableFrom)) || 
                          (meeting.availableUntil && now > new Date(meeting.availableUntil));

  const handleAgendarClick = () => {
    if (isLocked && mode === 'client') {
      return;
    }
    
    if (isOutsideWindow && mode === 'client') {
      return;
    }

    if (mode === 'client' && calendlyUrl) {
      setCalendlyModalOpen(true);
    } else {
      onSchedule(meeting);
    }
  };

  return (
    <div className="space-y-2">
      <div className={cn(
        "group flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border bg-white transition-all gap-4",
        isLocked ? "opacity-60 grayscale-[0.5] border-dashed" : "hover:border-primary/40 hover:shadow-sm"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
            isCompleted ? "bg-seven-success text-white" : "bg-muted text-muted-foreground"
          )}>
            #{meeting.meetingNumber}
          </div>
          <div>
            <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{meeting.title}</p>
            <div className="flex items-center gap-3 mt-1">
              <StatusTag label={meeting.status} variant={isCompleted ? 'success' : meeting.status === 'agendado' ? 'info' : 'neutral'} />
              {meeting.scheduledAt && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {new Date(meeting.scheduledAt).toLocaleDateString('pt-BR')} às {new Date(meeting.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {isOutsideWindow && !isCompleted && meeting.status !== 'agendado' && (
                <span className="text-[10px] text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded">
                  <AlertCircle className="h-3 w-3" /> Fora do período
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
          
          <div className="flex gap-2">
            {(mode === 'consultor' || mode === 'admin') && !calendlyUrl && (
              <Button 
                size="sm" 
                variant="ghost" 
                className={cn(
                  "h-8 gap-1.5 px-3 text-[10px] font-black uppercase",
                  showAvailability ? "bg-primary text-white hover:bg-primary/90" : "text-primary hover:bg-primary/5"
                )}
                onClick={() => onToggleAvailability(meeting.id)}
              >
                <Settings className="h-3.5 w-3.5" /> Disponibilidade
              </Button>
            )}


            {isLocked && mode === 'client' ? (
              <Button size="sm" variant="ghost" disabled className="h-8 gap-1.5 px-3 text-muted-foreground border-neutral-100 bg-neutral-50" title="Conclua o encontro anterior para liberar este agendamento.">
                <Clock className="h-3.5 w-3.5" /> Bloqueado
              </Button>
            ) : isOutsideWindow && mode === 'client' && !isCompleted && meeting.status !== 'agendado' ? (
              <Button size="sm" variant="ghost" disabled className="h-8 gap-1.5 px-3 text-amber-600 border-amber-100 bg-amber-50">
                <CalendarClock className="h-3.5 w-3.5" /> Indisponível
              </Button>
            ) : isCompleted ? (
              <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-3 text-seven-success font-bold bg-seven-success/5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Concluído
              </Button>
            ) : meeting.status === 'agendado' ? (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 gap-1.5 px-3" 
                  onClick={() => meeting.rescheduleUrl ? window.open(meeting.rescheduleUrl, '_blank') : handleAgendarClick()}
                >
                  Reagendar
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 gap-1.5 px-3 text-red-500 hover:bg-red-50 hover:text-red-600" 
                  onClick={() => meeting.cancelUrl ? window.open(meeting.cancelUrl, '_blank') : onCancel(meeting.id)}
                >
                  Cancelar
                </Button>
              </div>

            ) : (
              <Button 
                size="sm" 
                className={cn(
                  "h-8 gap-1.5 px-3",
                  mode === 'client' ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-primary text-white"
                )} 
                onClick={handleAgendarClick}
                disabled={isLocked && mode !== 'admin'}
              >
                <Calendar className="h-3.5 w-3.5" /> Agendar
              </Button>
            )}
          </div>
        </div>
      </div>

      <CalendlyModal 
        open={calendlyModalOpen}
        onClose={() => setCalendlyModalOpen(false)}
        url={calendlyUrl}
        prefill={{
          name: user?.nome,
          email: user?.email
        }}
        context={{
          clientId: meeting.clientId,
          contractId: meeting.contractId,
          productId: meeting.productId,
          moduleId: meeting.moduleId,
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          consultantId: meeting.consultantId,
          consultantName: meeting.consultantName
        }}
      />
    </div>
  );
}

function MeetingList({ phase, contrato, mode = 'admin' }: MeetingListProps) {
  const { meetings, isLoading, updateMeeting } = useContractModuleMeetings(phase.id);
  const [meetingForAvailability, setMeetingForAvailability] = useState<string | null>(null);
  const { toast } = useToast();
  
  if (isLoading) return <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>;
  if (!meetings || meetings.length === 0) return <div className="p-8 text-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed my-2">Nenhum encontro configurado para este módulo.</div>;

  const isCompleted = (status: string) => 
    ['realizada', 'concluida', 'concluído', 'concluída', 'resolvido', 'completed', 'done'].includes(status.toLowerCase());

  const handleCancelMeeting = async (meetingId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    try {
      await updateMeeting.mutateAsync({
        id: meetingId,
        status: 'pendente',
        scheduledAt: null
      });
      toast({ title: 'Sucesso', description: 'Agendamento cancelado.' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível cancelar o agendamento.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-2 mt-4 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase text-muted-foreground">Progresso: {meetings.filter(m => isCompleted(m.status)).length}/{meetings.length} encontros</span>
      </div>
      {meetings.map((meeting, index) => {
        const previousMeeting = index > 0 ? meetings[index - 1] : null;
        const isLocked = previousMeeting && !isCompleted(previousMeeting.status);

        return (
          <div key={meeting.id}>
            <MeetingRow 
              meeting={meeting}
              isLocked={!!isLocked}
              mode={mode}
              onSchedule={() => {}}
              onCancel={handleCancelMeeting}
              onToggleAvailability={(id) => setMeetingForAvailability(meetingForAvailability === id ? null : id)}
              showAvailability={meetingForAvailability === meeting.id}
            />

            
            {meetingForAvailability === meeting.id && (
              <div className="p-4 border rounded-lg bg-muted/5 animate-in slide-in-from-top-2 duration-200 mt-2">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black uppercase text-primary flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Configurar Disponibilidade: {meeting.title}
                  </h4>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setMeetingForAvailability(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <ConsultantAvailabilityConfig 
                  clientId={meeting.clientId}
                  contractId={meeting.contractId}
                  contractProductId={meeting.productId}
                  contractPhaseId={meeting.moduleId}
                  consultantId={meeting.consultantId || phase.responsibleConsultantId}
                  contractModuleMeetingId={meeting.id}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


function DocumentList({ phase, contrato, type, mode = 'admin' }: { phase: any, contrato: any, type: 'internal' | 'client', mode?: 'admin' | 'client' | 'consultor' }) {
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

function PhaseRow({ phase, contrato, isEditing, onUpdate, onDelete, onSchedule, onScheduleCalendly, mode = 'admin' }: { phase: any, contrato: any, isEditing?: boolean, onUpdate?: (data: any) => void, onDelete?: () => void, onSchedule: (meeting: ContractModuleMeeting) => void, onScheduleCalendly?: (meeting: ContractModuleMeeting) => void, mode?: 'admin' | 'client' | 'consultor' }) {
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
              <MeetingList phase={phase} contrato={contrato} mode={mode} />
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

function ConsultantAvailabilityConfig({ 
  clientId, 
  contractId, 
  contractProductId, 
  contractPhaseId, 
  consultantId,
  contractModuleMeetingId
}: { 
  clientId: string, 
  contractId: string, 
  contractProductId: string, 
  contractPhaseId: string, 
  consultantId: string,
  contractModuleMeetingId?: string
}) {
  const { availabilities, isLoading, upsertAvailability, deleteAvailability } = useConsultantAvailability({ 
    consultantId, contractModuleMeetingId
  });
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [weekday, setWeekday] = useState('1'); // Segunda

  useEffect(() => {
    if (availabilities && availabilities.length > 0) {
      const last = availabilities[availabilities.length - 1];
      setStartDate(last.start_date);
      setEndDate(last.end_date);
    }
  }, [availabilities]);
  
  const handleAddAvailability = async () => {
    if (!startDate || !endDate || !consultantId) return;
    
    // Check for existing availability with same weekday and meeting
    const existing = availabilities?.find(av => av.weekday === parseInt(weekday));

    await upsertAvailability.mutateAsync({
      id: existing?.id,
      contract_module_meeting_id: contractModuleMeetingId,
      consultant_id: consultantId,
      start_date: startDate,
      end_date: endDate,
      weekday: parseInt(weekday),
      start_time: startTime,
      end_time: endTime,
      slot_duration_minutes: 60,
      is_active: true
    });
  };

  if (isLoading) return <div className="p-4 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4 mt-4 animate-in fade-in duration-300">
      <div className="bg-white p-4 rounded-lg border border-primary/10 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-primary/10 pb-2">
          <Settings className="h-4 w-4 text-primary" />
          <h5 className="text-[11px] font-black uppercase tracking-wider text-primary">Configurar Horários Recorrentes</h5>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Período Disponível</label>
            <div className="flex gap-2">
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 text-[11px] font-medium" />
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 text-[11px] font-medium" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Dia da Semana</label>
            <Select value={weekday} onValueChange={setWeekday}>
              <SelectTrigger className="h-9 text-[11px] font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Segunda-feira</SelectItem>
                <SelectItem value="2">Terça-feira</SelectItem>
                <SelectItem value="3">Quarta-feira</SelectItem>
                <SelectItem value="4">Quinta-feira</SelectItem>
                <SelectItem value="5">Sexta-feira</SelectItem>
                <SelectItem value="6">Sábado</SelectItem>
                <SelectItem value="0">Domingo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Janela de Horário</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-9 pl-8 text-[11px] font-medium" />
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="relative flex-1">
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-9 pl-8 text-[11px] font-medium" />
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
        <Button size="sm" onClick={handleAddAvailability} className="w-full gap-2 font-black uppercase text-[10px] tracking-widest h-10 shadow-lg shadow-primary/10">
          <Plus className="h-4 w-4" /> Adicionar Disponibilidade
        </Button>
      </div>

      <div className="space-y-3">
        <h5 className="text-[10px] font-black uppercase text-muted-foreground px-1 tracking-widest flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" /> Horários Ativos
        </h5>
        {availabilities?.length === 0 ? (
          <div className="p-10 text-center text-xs text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5 font-medium">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p>Nenhuma disponibilidade configurada para este encontro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {availabilities?.map(av => (
              <div key={av.id} className="flex items-center justify-between p-4 rounded-xl border bg-white group hover:border-primary/40 transition-all shadow-sm hover:shadow-md">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                     <Clock className="h-5 w-5 text-primary" />
                   </div>
                   <div>
                     <p className="text-xs font-black uppercase tracking-tight text-foreground">
                       {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][av.weekday]}
                     </p>
                     <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                       <span className="text-primary font-bold">{av.start_time.substring(0, 5)} - {av.end_time.substring(0, 5)}</span>
                       <span className="opacity-30">|</span>
                       <span>{new Date(av.start_date + 'T12:00:00').toLocaleDateString('pt-BR')} a {new Date(av.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                     </p>
                   </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => deleteAvailability.mutate(av.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductItem({ product, contrato, isEditing: isParentEditing, onSchedule, onScheduleCalendly, mode = 'admin', onUpdateProduct, onDeleteProduct }: { product: any, contrato: any, isEditing?: boolean, onSchedule: (meeting: ContractModuleMeeting) => void, onScheduleCalendly?: (meeting: ContractModuleMeeting) => void, mode?: 'admin' | 'client' | 'consultor', onUpdateProduct?: (data: any) => Promise<void>, onDeleteProduct?: () => Promise<void> }) {
  const { toast } = useToast();
  const { phases: remotePhases, isLoading: isLoadingPhases, upsertPhases, deletePhase } = useContractProductPhases(product.id);
  const [localPhases, setLocalPhases] = useState<any[]>([]);
  const [localProduct, setLocalProduct] = useState<any>(product);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (remotePhases) {
      setLocalPhases(remotePhases);
    }
  }, [remotePhases]);

  useEffect(() => {
    setLocalProduct(product);
  }, [product]);

  const handleSave = async () => {
    try {
      console.log("Iniciando salvamento do produto e módulos...", { localProduct, localPhases });
      
      // 1. Save product details if they changed
      if (onUpdateProduct) {
        await onUpdateProduct(localProduct);
      }
      
      // 2. Prepare phases for saving
      const phasesToSave = localPhases.map((phase, index) => ({
        ...phase,
        contractProductId: product.id,
        orderIndex: index + 1
      }));
      
      // 3. Save phases/modules
      await upsertPhases.mutateAsync(phasesToSave);
      
      setIsEditing(false);
      toast({ title: "Sucesso", description: "Produto do contrato atualizado com sucesso." });
    } catch (error: any) {
      console.error("Erro ao salvar produto do contrato:", error);
      toast({ 
        title: "Erro", 
        description: error.message || "Não foi possível salvar as alterações do produto. Verifique os vínculos no Supabase.",
        variant: "destructive"
      });
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
      status: 'pendente',
      responsibleConsultantId: contrato.consultorId // Herda o responsável do contrato por padrão
    }]);
  };

  const removeLocalPhase = async (index: number) => {
    const phase = localPhases[index];
    if (phase.id && !phase.id.startsWith('temp-')) {
      if (!confirm('Tem certeza que deseja remover este módulo e todos os seus encontros?')) return;
      try {
        await deletePhase.mutateAsync(phase.id);
        toast({ title: "Sucesso", description: "Módulo removido com sucesso." });
      } catch (error) {
        console.error(error);
        toast({ title: "Erro", description: "Não foi possível remover o módulo.", variant: "destructive" });
        return;
      }
    }
    setLocalPhases(localPhases.filter((_, i) => i !== index));
  };

  const totalMinutes = localPhases && localPhases.length > 0
    ? localPhases.reduce((acc, ph) => acc + (ph.durationMinutes || 0), 0)
    : (product.consultantHours || 0) + (product.silvaneHours || 0);

  return (
    <div className="border rounded-xl mb-6 overflow-hidden bg-white shadow-sm border-muted/40 transition-all">
      <div className={cn(
        "p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors",
        isEditing ? "bg-primary/5 border-b-primary/20" : "bg-muted/20 border-b"
      )}>
        <div className="flex items-center gap-4 flex-1">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
             <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-base text-foreground tracking-tight">{product.productNome}</h4>
            
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground">Data Início</label>
                  <Input 
                    type="date" 
                    value={localProduct.startDate || ''} 
                    onChange={e => setLocalProduct({...localProduct, startDate: e.target.value})}
                    className="h-8 text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground">Data Fim</label>
                  <Input 
                    type="date" 
                    value={localProduct.endDate || ''} 
                    onChange={e => setLocalProduct({...localProduct, endDate: e.target.value})}
                    className="h-8 text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground">Valor (R$)</label>
                  <Input 
                    type="number" 
                    value={localProduct.value || ''} 
                    onChange={e => setLocalProduct({...localProduct, value: Number(e.target.value)})}
                    className="h-8 text-xs font-medium tabular-nums"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {product.startDate ? new Date(product.startDate).toLocaleDateString() : '-'} a {product.endDate ? new Date(product.endDate).toLocaleDateString() : '-'}
                </span>
                {product.value > 0 && (
                  <span className="text-[10px] font-bold text-muted-foreground border-l pl-4 flex items-center gap-1.5 uppercase tabular-nums">
                    <DollarSign className="h-3 w-3" />
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.value)}
                  </span>
                )}
                {totalMinutes > 0 && (
                  <span className="text-[10px] font-bold text-muted-foreground border-l pl-4 flex items-center gap-1.5 uppercase">
                    <Clock className="h-3 w-3" />
                    Duração: {formatDuration(totalMinutes)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => { 
                  setLocalPhases(remotePhases || []); 
                  setLocalProduct(product);
                  setIsEditing(false); 
                }} 
                className="h-8 gap-1.5 px-3"
              >
                <X className="h-3.5 w-3.5" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} className="h-8 gap-1.5 px-3 shadow-lg shadow-primary/20">
                <Save className="h-3.5 w-3.5" />
                Salvar
              </Button>
            </div>
          ) : (
            <>
              <StatusTag label={labelStatus[product.status] || product.status} />
              {mode === 'admin' && (
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setIsEditing(true)} 
                    className="h-8 gap-1.5 px-3 border-primary/20 text-primary hover:bg-primary/5 font-bold"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar Produto
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={onDeleteProduct} 
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    title="Remover Produto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </>
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
                onScheduleCalendly={onScheduleCalendly}
                mode={mode}
              />
            ))}

            {isEditing && mode === 'admin' && (
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
  expanded = false,
  mode = 'admin',
  onAddProduct,
  onScheduleCalendly
}: { 
  contrato: any, 
  isEditing?: boolean,
  expanded?: boolean,
  mode?: 'admin' | 'client' | 'consultor',
  onAddProduct?: () => void,
  onScheduleCalendly?: (meeting: ContractModuleMeeting) => void
}) {


  const { products, isLoading: isLoadingProducts, upsertContractProducts, deleteContractProduct } = useContractProducts(contrato.id);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [initialMeetingData, setInitialMeetingData] = useState<Partial<Reuniao> | null>(null);

  const [clientScheduleModalOpen, setClientScheduleModalOpen] = useState(false);
  const [selectedModuleMeeting, setSelectedModuleMeeting] = useState<ContractModuleMeeting | null>(null);

  const handleScheduleMeeting = (meeting: ContractModuleMeeting) => {
    if (mode === 'client') {
      setSelectedModuleMeeting(meeting);
      setClientScheduleModalOpen(true);
    } else {
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
    }
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
            <div className="flex items-center justify-between border-b border-muted/60 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-1 rounded-full bg-primary" />
                <h4 className="text-sm font-black uppercase tracking-tight text-muted-foreground">Detalhamento de Produtos e Módulos</h4>
              </div>
              
              {mode === 'admin' && onAddProduct && (
                <Button 
                  onClick={onAddProduct} 
                  size="sm" 
                  className="gap-2 shadow-sm font-bold bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Produto
                </Button>
              )}
            </div>

            <div className="space-y-6">
              {(products || []).map(product => (
                <ProductItem 
                  key={product.id} 
                  product={product} 
                  contrato={contrato} 
                  isEditing={isEditing}
                  mode={mode}
                  onUpdateProduct={async (data) => {
                    await upsertContractProducts.mutateAsync([data]);
                  }}
                  onDeleteProduct={async () => {
                    if (confirm(`Tem certeza que deseja remover o produto "${product.productNome}" deste contrato?\n\nIsso removerá também os módulos e encontros vinculados.`)) {
                      await deleteContractProduct.mutateAsync(product.id);
                    }
                  }}
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

      {selectedModuleMeeting && (
        <ModalAgendamentoCliente
          open={clientScheduleModalOpen}
          onClose={() => setClientScheduleModalOpen(false)}
          moduleMeeting={selectedModuleMeeting}
        />
      )}
    </AccordionItem>
  );
}


