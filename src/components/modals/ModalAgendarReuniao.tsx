import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useReunioes } from '@/hooks/useReunioes';
import { useContratos } from '@/hooks/useContratos';
import { Loader2, Calendar, Clock, ListChecks } from 'lucide-react';
import { useClientProducts } from '@/hooks/useClientProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';
import { cn } from '@/lib/utils';
import { useConsultores } from '@/hooks/useConsultores';
import type { Reuniao } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  clienteId: string;
  clienteNome: string;
  initialData?: Partial<Reuniao>;
}

export const ModalAgendarReuniao = ({ open, onClose, clienteId, clienteNome, initialData }: Props) => {
  const { upsertReuniao } = useReunioes();
  const { toast } = useToast();
  const { clientProducts } = useClientProducts(clienteId);
  const { consultores } = useConsultores();

  const [form, setForm] = useState({
    data: '', horario: '', duracao: '60', plataforma: 'google_meet',
    link: '', contractProductId: '', contractProductPhaseId: '', participantes: '', observacao: '',
    consultorId: '', title: '',
  });

  useEffect(() => {
    if (initialData) {
      setForm(prev => ({
        ...prev,
        contractProductId: initialData.contractProductId || prev.contractProductId,
        contractProductPhaseId: initialData.contractProductPhaseId || prev.contractProductPhaseId,
        consultorId: initialData.consultorId || prev.consultorId,
        title: initialData.title || prev.title,
        data: initialData.meetingDate || prev.data,
        horario: initialData.startTime || prev.horario,
      }));
    }
  }, [initialData, open]);

  const { phases: productPhases } = useContractProductPhases(form.contractProductId);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (k: string, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: false }));
  };

  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.data) newErrors.data = true;
    if (!form.horario) newErrors.horario = true;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSalvar = async () => {
    if (!validate()) {
      toast({ 
        title: 'Campos obrigatórios', 
        description: 'Por favor, preencha data e horário.', 
        variant: 'destructive' 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await upsertReuniao.mutateAsync({
        clienteId,
        contractProductId: form.contractProductId || (clientProducts && clientProducts[0]?.id),
        contractProductPhaseId: form.contractProductPhaseId || null,
        consultorId: form.consultorId || initialData?.consultorId,
        meetingDate: form.data,
        startTime: form.horario,
        duracao: parseInt(form.duracao),
        tipo: form.plataforma,
        meetingUrl: form.link,
        title: form.title || form.observacao || 'Reunião agendada',
        status: 'agendada',
        participantes: form.participantes.split(',').map(p => p.trim()).filter(Boolean),
        source: 'manual',
        contractModuleMeetingId: initialData?.contractModuleMeetingId,
        contractId: initialData?.contractId,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal open={open} onClose={onClose} titulo="Agendar Reunião" descricao={`Nova reunião com ${clienteNome}`}>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <div className="space-y-0.5">
          <Label>Título da Reunião</Label>
          <Input value={form.title} onChange={e => set('title', e.target.value)} disabled={!!initialData?.title} className="bg-muted/30 font-medium" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <Label className={cn(errors.data && "text-destructive")}>Data *</Label>
            <div className="relative group">
              <Input 
                type="date" 
                value={form.data} 
                onChange={e => set('data', e.target.value)} 
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
          <div className="space-y-0.5">
            <Label className={cn(errors.horario && "text-destructive")}>Horário *</Label>
            <div className="relative group">
              <Input 
                type="time" 
                value={form.horario} 
                onChange={e => set('horario', e.target.value)} 
                onFocus={(e) => e.currentTarget.showPicker?.()}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className={cn(
                  "pl-9 hide-native-icon cursor-pointer relative z-0",
                  errors.horario && "border-destructive focus-visible:ring-destructive"
                )}
              />
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <Label>Duração (min)</Label>
            <Select value={form.duracao} onValueChange={v => set('duracao', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">60 min</SelectItem>
                <SelectItem value="90">90 min</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-0.5">
            <Label>Plataforma</Label>
            <Select value={form.plataforma} onValueChange={v => set('plataforma', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="google_meet">Google Meet</SelectItem>
                <SelectItem value="zoom">Zoom</SelectItem>
                <SelectItem value="teams">Teams</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-0.5">
          <Label>Link da reunião</Label>
          <Input value={form.link} onChange={e => set('link', e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-0.5">
          <Label>Consultor Responsável</Label>
          <Select value={form.consultorId} onValueChange={v => set('consultorId', v)} disabled={!!initialData?.consultorId}>
            <SelectTrigger className={cn(!!initialData?.consultorId && "bg-muted/30")}><SelectValue placeholder="Selecione o consultor..." /></SelectTrigger>
            <SelectContent>
              {consultores?.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {clientProducts && clientProducts.length > 0 && (
          <div className="space-y-0.5">
            <Label>Produto Contratado</Label>
            <Select value={form.contractProductId} onValueChange={v => set('contractProductId', v)} disabled={!!initialData?.contractProductId}>
              <SelectTrigger className={cn(!!initialData?.contractProductId && "bg-muted/30")}><SelectValue placeholder="Selecione o produto..." /></SelectTrigger>
              <SelectContent>
                {clientProducts.map(cp => <SelectItem key={cp.id} value={cp.id}>{cp.productNome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {productPhases && productPhases.length > 0 && (
          <div className="space-y-0.5">
            <Label>Etapa da Jornada</Label>
            <Select value={form.contractProductPhaseId} onValueChange={v => set('contractProductPhaseId', v)} disabled={!!initialData?.contractProductPhaseId}>
              <SelectTrigger className={cn(!!initialData?.contractProductPhaseId && "bg-muted/30")}><SelectValue placeholder="Selecione a etapa..." /></SelectTrigger>
              <SelectContent>
                {productPhases.map(ph => <SelectItem key={ph.id} value={ph.id}>{ph.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-0.5">
          <Label>Participantes</Label>
          <Input value={form.participantes} onChange={e => set('participantes', e.target.value)} placeholder="Nomes separados por vírgula" />
        </div>
        <div className="space-y-0.5">
          <Label>Observação</Label>
          <Textarea value={form.observacao} onChange={e => set('observacao', e.target.value)} placeholder="Informações adicionais..." rows={2} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
        <Button onClick={handleSalvar} disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Agendando...</>
          ) : 'Agendar Reunião'}
        </Button>
      </div>
    </BaseModal>
  );
};
