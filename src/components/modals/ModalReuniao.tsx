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
import { Loader2, Calendar, Clock, MapPin, Link as LinkIcon, AlignLeft, Users as UsersIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Reuniao, StatusReuniao } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  reuniao?: Reuniao | null;
  // Pre-fill data
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
  const [phaseResponsibleId, setPhaseResponsibleId] = useState<string | null>(null);

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

  const { products: contractProducts } = useContractProducts(contractId);
  const { phases: productPhases } = useContractProductPhases(contractProductId);
  const { meetings: moduleMeetings } = useContractModuleMeetings(contractProductPhaseId);

  const contratosFiltrados = (contratos || []).filter(c => !clienteId || c.clienteId === clienteId);


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
      setStatus(initialData.status || 'agendada');
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

  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    if (!title.trim()) newErrors.title = true;
    if (!clienteId) newErrors.clienteId = true;
    if (!consultorId) newErrors.consultorId = true;
    if (!meetingDate) newErrors.meetingDate = true;
    if (!startTime) newErrors.startTime = true;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos marcados com *",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<Reuniao> = {
        id: reuniao?.id,
        title,
        tipo,
        clienteId,
        contractId: (contractId === 'none' || !contractId) ? null : contractId,
        contractProductId: (contractProductId === 'none' || !contractProductId) ? null : contractProductId,
        contractProductPhaseId: (contractProductPhaseId === 'none' || !contractProductPhaseId) ? null : contractProductPhaseId,
        contractModuleMeetingId: (contractModuleMeetingId === 'none' || !contractModuleMeetingId) ? null : contractModuleMeetingId,
        consultorId,
        status,
        meetingDate,
        startTime,
        duracao,
        meetingUrl,
        location,
        description,
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
      <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="h-11 px-6 font-bold">
        Cancelar
      </Button>
      <Button onClick={handleSave} disabled={isSubmitting} className="h-11 px-8 font-bold shadow-lg shadow-primary/20">
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Reunião'}
      </Button>
    </div>
  );

  return (
    <BaseModal 
      open={open} 
      onClose={onClose} 
      titulo={reuniao ? "Editar Reunião" : "Nova Reunião"}
      size="lg"
      footer={footer}
    >
      <div className="space-y-6 py-2">
        <div className="space-y-2">
          <Label className={cn("text-[11px] font-bold uppercase tracking-wider text-muted-foreground", errors.title && "text-destructive")}>
            Título da Reunião *
          </Label>
          <Input 
            value={title} 
            onChange={e => {
              setTitle(e.target.value);
              if (errors.title) setErrors(prev => ({ ...prev, title: false }));
            }} 
            className={cn("h-11 font-medium", errors.title && "border-destructive focus-visible:ring-destructive")}
            placeholder="Ex: Reunião de Alinhamento Mensal"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className={cn("text-[11px] font-bold uppercase tracking-wider text-muted-foreground", errors.clienteId && "text-destructive")}>
              Cliente *
            </Label>
            <Select 
              value={clienteId} 
              onValueChange={v => {
                setClienteId(v);
                setContractId('');
                setContractProductId('');
                setContractProductPhaseId('');
                setContractModuleMeetingId('');
                if (errors.clienteId) setErrors(prev => ({ ...prev, clienteId: false }));
              }}
            >
              <SelectTrigger className={cn("h-11", errors.clienteId && "border-destructive focus:ring-destructive")}>
                <SelectValue placeholder="Selecione o cliente..." />
              </SelectTrigger>
              <SelectContent>
                {(clientes || []).map(c => <SelectItem key={c.id} value={c.id}>{c.nomeFantasia || c.razaoSocial}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={cn("text-[11px] font-bold uppercase tracking-wider text-muted-foreground", errors.consultorId && "text-destructive")}>
              Responsável *
            </Label>
            <Select 
              value={consultorId} 
              onValueChange={v => {
                setConsultorId(v);
                if (errors.consultorId) setErrors(prev => ({ ...prev, consultorId: false }));
              }}
            >
              <SelectTrigger className={cn("h-11", errors.consultorId && "border-destructive focus:ring-destructive")}>
                <SelectValue placeholder="Selecione o consultor..." />
              </SelectTrigger>
              <SelectContent>
                {(consultores || []).map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Contrato</Label>
            <Select value={contractId || 'none'} onValueChange={v => {
              setContractId(v);
              setContractProductId('');
              setContractProductPhaseId('');
              setContractModuleMeetingId('');
            }}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Selecione um contrato..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {contratosFiltrados.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.tipo} ({new Date(c.dataInicio).toLocaleDateString('pt-BR')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Produto</Label>
            <Select value={contractProductId || 'none'} onValueChange={v => {
              setContractProductId(v);
              setContractProductPhaseId('');
              setContractModuleMeetingId('');
            }}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Selecione um produto..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {(contractProducts || []).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.productNome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Módulo</Label>
            <Select value={contractProductPhaseId || 'none'} onValueChange={v => {
              setContractProductPhaseId(v);
              setContractModuleMeetingId('');
            }}>

              <SelectTrigger className="h-11"><SelectValue placeholder="Selecione o módulo..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {(productPhases || []).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Encontro / Slot</Label>
            <Select value={contractModuleMeetingId || 'none'} onValueChange={setContractModuleMeetingId}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Selecione o encontro..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {(moduleMeetings || []).map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.title || `Encontro ${m.meetingNumber}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Local / Link</Label>
            <div className="relative">
              <Input 
                value={meetingUrl || location} 
                onChange={e => {
                  setMeetingUrl(e.target.value);
                  setLocation(e.target.value);
                }} 
                className="h-11 pl-10"
                placeholder="Meet, Zoom ou Endereço" 
              />
              {meetingUrl?.startsWith('http') ? (
                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              ) : (
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className={cn("text-[11px] font-bold uppercase tracking-wider text-muted-foreground", errors.meetingDate && "text-destructive")}>
              Data *
            </Label>
            <div className="relative">
              <Input 
                type="date" 
                value={meetingDate} 
                onChange={e => {
                  setMeetingDate(e.target.value);
                  if (errors.meetingDate) setErrors(prev => ({ ...prev, meetingDate: false }));
                }} 
                className={cn("h-11 pl-10", errors.meetingDate && "border-destructive")}
              />
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className={cn("text-[11px] font-bold uppercase tracking-wider text-muted-foreground", errors.startTime && "text-destructive")}>
              Horário *
            </Label>
            <div className="relative">
              <Input 
                type="time" 
                value={startTime} 
                onChange={e => {
                  setStartTime(e.target.value);
                  if (errors.startTime) setErrors(prev => ({ ...prev, startTime: false }));
                }} 
                className={cn("h-11 pl-10", errors.startTime && "border-destructive")}
              />
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Duração (min)</Label>
            <Input 
              type="number" 
              value={duracao} 
              onChange={e => setDuracao(Number(e.target.value))} 
              className="h-11 font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Descrição / Pauta</Label>
          <div className="relative">
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Descreva os tópicos que serão abordados..." 
              className="min-h-[100px] pl-10 py-3"
            />
            <AlignLeft className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
