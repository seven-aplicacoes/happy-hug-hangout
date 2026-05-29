import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { MethodologyNote } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  open: boolean;
  onClose: () => void;
  note?: MethodologyNote | null;
  phases?: any[];
}

export const ModalMethodologyNote = ({ open, onClose, note, phases = [] }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<MethodologyNote['type']>('observacao');
  const [status, setStatus] = useState<MethodologyNote['status']>('aberto');
  const [priority, setPriority] = useState<MethodologyNote['priority']>('media');
  const [relatedArea, setRelatedArea] = useState('');
  const [relatedPhaseId, setRelatedPhaseId] = useState<string | undefined>(undefined);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setDescription(note.description || '');
      setType(note.type);
      setStatus(note.status);
      setPriority(note.priority);
      setRelatedArea(note.related_area || '');
      setRelatedPhaseId(note.related_phase_id);
    } else {
      setTitle('');
      setDescription('');
      setType('observacao');
      setStatus('aberto');
      setPriority('media');
      setRelatedArea('metodologia_geral');
      setRelatedPhaseId(undefined);
    }
  }, [note, open]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "O título é obrigatório." });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const payload: any = {
        title,
        description,
        type,
        status,
        priority,
        related_area: relatedArea || null,
        related_phase_id: relatedPhaseId === 'none' ? null : relatedPhaseId,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      };

      if (note) {
        const { error } = await supabase
          .from('methodology_notes')
          .update(payload)
          .eq('id', note.id);
        if (error) throw error;
      } else {
        payload.created_by = user?.id;
        const { error } = await supabase
          .from('methodology_notes')
          .insert(payload);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['methodology-notes'] });
      toast({ title: 'Sucesso', description: 'Registro metodológico salvo com sucesso.' });
      onClose();
    } catch (error: any) {
      console.error('Error saving methodology note:', error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal 
      open={open} 
      onClose={onClose} 
      titulo={note ? "Editar Registro Metodológico" : "Novo Registro Metodológico"}
      size="md"
    >
      <div className="space-y-4 py-2">
        <div className="space-y-1">
          <Label>Título *</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Definir critérios para templates" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="observacao">Observação</SelectItem>
                <SelectItem value="pendencia">Pendência</SelectItem>
                <SelectItem value="decisao_futura">Decisão futura</SelectItem>
                <SelectItem value="risco">Risco</SelectItem>
                <SelectItem value="pergunta">Pergunta</SelectItem>
                <SelectItem value="ideia">Ideia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em_discussao">Em discussão</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="descartado">Descartado</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Prioridade</Label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Área Relacionada</Label>
            <Select value={relatedArea} onValueChange={setRelatedArea}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="metodologia_geral">Metodologia Geral</SelectItem>
                <SelectItem value="materiais">Materiais</SelectItem>
                <SelectItem value="templates">Templates</SelectItem>
                <SelectItem value="perguntas">Perguntas</SelectItem>
                <SelectItem value="alertas">Alertas</SelectItem>
                <SelectItem value="conteudo_cliente">Conteúdo Cliente</SelectItem>
                <SelectItem value="conteudo_consultor">Conteúdo Consultor</SelectItem>
                <SelectItem value="governanca">Governança</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label>Fase Relacionada (opcional)</Label>
          <Select value={relatedPhaseId || 'none'} onValueChange={setRelatedPhaseId}>
            <SelectTrigger><SelectValue placeholder="Selecione uma fase" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {phases.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Descrição</Label>
          <Textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            rows={3} 
            placeholder="Detalhes sobre esta observação ou pendência..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Registro'}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
