import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useReunioes } from '@/hooks/useReunioes';
import { useClientes } from '@/hooks/useClientes';
import { useConsultores } from '@/hooks/useConsultores';
import { useContratos } from '@/hooks/useContratos';
import { useContractProducts } from '@/hooks/useContractProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';
import { useContractModuleMeetings } from '@/hooks/useContractModuleMeetings';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, Clock, MapPin, Link as LinkIcon, AlignLeft, Users as UsersIcon, AlertTriangle } from 'lucide-react';
import { checkConsultantConflict } from '@/lib/conflicts';
import { minutesToHHMM, hhmmToMinutes } from '@/lib/duration';
import { cn } from '@/lib/utils';
import type { Reuniao, StatusReuniao } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  reuniao?: Reuniao | null;
  initialData?: Partial<Reuniao>;
}

export const ModalReuniao = ({ open, onClose, reuniao, initialData }: Props) => {
  const { upsertReuniao } = useReunioes();
  const { toast } = useToast();
  const { clientes } = useClientes();
  const { consultores } = useConsultores();
  const { contratos } = useContratos();
  
  const [title, setTitle] = useState('');
  const [tipo, setTipo] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [contractId, setContractId] = useState('');
  const [contractProductId, setContractProductId] = useState('');
  const [contractProductPhaseId, setContractProductPhaseId] = useState('');
  const [contractModuleMeetingId, setContractModuleMeetingId] = useState('');
  const [consultorId, setConsultorId] = useState('');
  const [status, setStatus] = useState<StatusReuniao>('agendada');
  const [meetingDate, setMeetingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duracao, setDuracao] = useState(60);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phaseResponsibleId, setPhaseResponsibleId] = useState<string | null>(null);

  const { products: contractProducts } = useContractProducts(contractId);
  const { phases: productPhases } = useContractProductPhases(contractProductId);
  const { meetings: moduleMeetings } = useContractModuleMeetings(contractProductPhaseId);

  const contratosFiltrados = (contratos || []).filter(c => !clienteId || c.clienteId === clienteId);
  const isLocked = !!initialData || !!reuniao;

  useEffect(() => {
    if (reuniao) {
      setTitle(reuniao.title || '');
      setTipo(reuniao.tipo || '');
      setClienteId(reuniao.clienteId || '');
      setContractId(reuniao.contractId || '');
      setContractProductId(reuniao.contractProductId || '');
      setContractProductPhaseId(reuniao.contractProductPhaseId || '');
      setContractModuleMeetingId(reuniao.contractModuleMeetingId || '');
      setConsultorId(reuniao.consultorId || '');
      setStatus(reuniao.status || 'agendada');
      setMeetingDate(reuniao.meetingDate || '');
      setStartTime(reuniao.startTime || '');
      setDuracao(reuniao.duracao || 60);
      setMeetingUrl(reuniao.meetingUrl || '');
      setLocation(reuniao.location || '');
      setDescription(reuniao.description || '');
    } else if (initialData) {
      setTitle(initialData.title || '');
      setTipo(initialData.tipo || 'Check-in Semanal');
      setClienteId(initialData.clienteId || '');
      setContractId(initialData.contractId || '');
      setContractProductId(initialData.contractProductId || '');
      setContractProductPhaseId(initialData.contractProductPhaseId || '');
      setContractModuleMeetingId(initialData.contractModuleMeetingId || '');
      setConsultorId(initialData.consultorId || '');
      setStatus('agendada');
      setMeetingDate(initialData.meetingDate || '');
      setStartTime(initialData.startTime || '');
      setDuracao(initialData.duracao || 60);
      setMeetingUrl(initialData.meetingUrl || '');
      setLocation(initialData.location || '');
      setDescription(initialData.description || '');
    } else {
      setTitle('');
      setTipo('Check-in Semanal');
      setClienteId('');
      setContractId('');
      setContractProductId('');
      setContractProductPhaseId('');
      setContractModuleMeetingId('');
      setConsultorId('');
      setStatus('agendada');
      setMeetingDate('');
      setStartTime('');
      setDuracao(60);
      setMeetingUrl('');
      setLocation('');
      setDescription('');
    }
    setErrors({});
  }, [reuniao, initialData, open]);

  useEffect(() => {
    if (contractProductPhaseId && contractProductPhaseId !== 'none') {
      const selectedPhase = productPhases?.find(p => p.id === contractProductPhaseId);
      if (selectedPhase?.responsibleConsultantId) {
        setPhaseResponsibleId(selectedPhase.responsibleConsultantId);
        if (!reuniao && (!consultorId || consultorId === '')) {
          setConsultorId(selectedPhase.responsibleConsultantId);
        }
      } else {
        setPhaseResponsibleId(null);
      }
    } else {
      setPhaseResponsibleId(null);
    }
  }, [contractProductPhaseId, productPhases, reuniao, consultorId]);

  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    if (!title.trim()) newErrors.title = true;
    if (!clienteId) newErrors.clienteId = true;
    if (!consultorId) newErrors.consultorId = true;
    if (!meetingDate) newErrors.meetingDate = true;
    if (!startTime) newErrors.startTime = true;
    if (isLocked && !phaseResponsibleId && contractProductPhaseId && contractProductPhaseId !== 'none') {
      toast({ title: "Responsável ausente", description: "Defina um responsável no módulo antes de salvar.", variant: "destructive" });
      return false;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      // Conflict validation
      const endTime = calculateEndTime(startTime, duracao);
      const { hasConflict, conflictingMeeting } = await checkConsultantConflict({
        consultantId,
        date: meetingDate,
        startTime,
        endTime,
        ignoreMeetingId: reuniao?.id
      });

      if (hasConflict) {
        toast({ 
          title: "Conflito de Agenda", 
          description: `Este consultor já possui uma reunião agendada (${conflictingMeeting.start_time} - ${conflictingMeeting.title}).`, 
          variant: "destructive" 
        });
        setIsSubmitting(false);
        return;
      }

      const payload: Partial<Reuniao> = {
        id: reuniao?.id,
        title, tipo, clienteId,
        contractId: (contractId === 'none' || !contractId) ? null : contractId,
        contractProductId: (contractProductId === 'none' || !contractProductId) ? null : contractProductId,
        contractProductPhaseId: (contractProductPhaseId === 'none' || !contractProductPhaseId) ? null : contractProductPhaseId,
        contractModuleMeetingId: (contractModuleMeetingId === 'none' || !contractModuleMeetingId) ? null : contractModuleMeetingId,
        consultorId, status, meetingDate, startTime, duracao, meetingUrl, location, description,
        source: reuniao?.source || 'manual'
      };
      await upsertReuniao.mutateAsync(payload);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="h-11 px-6 font-bold">Cancelar</Button>
      <Button onClick={handleSave} disabled={isSubmitting} className="h-11 px-8 font-bold shadow-lg shadow-primary/20">
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Reunião'}
      </Button>
    </div>
  );

  return (
    <BaseModal open={open} onClose={onClose} titulo={reuniao ? "Reagendar Reunião" : "Nova Reunião"} size="lg" footer={footer}>
      <div className="space-y-6 py-2">
        {isLocked && !phaseResponsibleId && contractProductPhaseId && contractProductPhaseId !== 'none' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-xs flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            Este módulo ainda não possui consultor responsável definido. Defina um responsável antes de salvar o encontro.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className={cn("text-[11px] font-bold uppercase tracking-wider text-muted-foreground", errors.title && "text-destructive")}>Título da Reunião *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className={cn("h-11 font-medium", errors.title && "border-destructive")} />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tipo de Reunião</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Check-in Semanal">Check-in Semanal</SelectItem>
                <SelectItem value="Alinhamento Estratégico">Alinhamento Estratégico</SelectItem>
                <SelectItem value="Apresentação de Resultados">Apresentação de Resultados</SelectItem>
                <SelectItem value="Workshop / Treinamento">Workshop / Treinamento</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="agendada">Agendada</SelectItem>
                <SelectItem value="realizada">Realizada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
                <SelectItem value="remarcada">Remarcada</SelectItem>
                <SelectItem value="reagendada">Reagendada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={cn("text-[11px] font-bold uppercase tracking-wider text-muted-foreground", errors.clienteId && "text-destructive")}>Cliente *</Label>
            <Select value={clienteId} disabled={isLocked} onValueChange={v => setClienteId(v)}>
              <SelectTrigger className={cn("h-11", errors.clienteId && "border-destructive")} disabled={isLocked}><SelectValue /></SelectTrigger>
              <SelectContent>
                {(clientes || []).map(c => <SelectItem key={c.id} value={c.id}>{c.nomeFantasia || c.razaoSocial}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className={cn("text-[11px] font-bold uppercase tracking-wider text-muted-foreground", errors.consultorId && "text-destructive")}>Responsável *</Label>
            <Select value={consultorId} disabled={isLocked || !!phaseResponsibleId} onValueChange={v => setConsultorId(v)}>
              <SelectTrigger className={cn("h-11", errors.consultorId && "border-destructive")} disabled={isLocked || !!phaseResponsibleId}><SelectValue /></SelectTrigger>
              <SelectContent>
                {(consultores || []).map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Contrato</Label>
            <Select value={contractId || 'none'} disabled={isLocked} onValueChange={v => setContractId(v)}>
              <SelectTrigger className="h-11" disabled={isLocked}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {contratosFiltrados.map(c => <SelectItem key={c.id} value={c.id}>{c.tipo} ({new Date(c.dataInicio).toLocaleDateString('pt-BR')})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Produto</Label>
            <Select value={contractProductId || 'none'} disabled={isLocked} onValueChange={v => setContractProductId(v)}>
              <SelectTrigger className="h-11" disabled={isLocked}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {(contractProducts || []).map(p => <SelectItem key={p.id} value={p.id}>{p.productNome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Módulo</Label>
            <Select value={contractProductPhaseId || 'none'} disabled={isLocked} onValueChange={v => setContractProductPhaseId(v)}>
              <SelectTrigger className="h-11" disabled={isLocked}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {(productPhases || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Encontro / Slot</Label>
            <Select value={contractModuleMeetingId || 'none'} disabled={isLocked} onValueChange={setContractModuleMeetingId}>
              <SelectTrigger className="h-11" disabled={isLocked}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {(moduleMeetings || []).map(m => <SelectItem key={m.id} value={m.id}>{m.title || `Encontro ${m.meetingNumber}`}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Local / Link</Label>
            <Input value={meetingUrl || location} onChange={e => { setMeetingUrl(e.target.value); setLocation(e.target.value); }} className="h-11" placeholder="Meet, Zoom ou Endereço" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className={cn("text-[11px] font-bold uppercase tracking-wider text-muted-foreground", errors.meetingDate && "text-destructive")}>Data *</Label>
            <Input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} className={cn("h-11", errors.meetingDate && "border-destructive")} />
          </div>
          <div className="space-y-2">
            <Label className={cn("text-[11px] font-bold uppercase tracking-wider text-muted-foreground", errors.startTime && "text-destructive")}>Horário *</Label>
            <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={cn("h-11", errors.startTime && "border-destructive")} />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Duração (min)</Label>
            <Input type="number" value={duracao} onChange={e => setDuracao(Number(e.target.value))} className="h-11 font-medium" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Descrição / Pauta</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva os tópicos..." className="min-h-[100px]" />
        </div>
      </div>
    </BaseModal>
  );
};

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0);
  date.setMinutes(date.getMinutes() + durationMinutes);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
