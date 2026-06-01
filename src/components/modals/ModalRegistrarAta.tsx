import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Save, FileText, Info, Users, CheckCircle2, ListChecks, Lock } from 'lucide-react';
import type { MeetingMinutes } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  meetingId: string;
  meetingTitle: string;
  onSuccess?: () => void;
}

export const ModalRegistrarAta = ({ open, onClose, meetingId, meetingTitle, onSuccess }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [minutes, setMinutes] = useState<Partial<MeetingMinutes>>({
    summary: '',
    discussionPoints: '',
    decisions: '',
    nextSteps: '',
    internalNotes: '',
    visibleToClient: true,
  });

  useEffect(() => {
    if (open && meetingId) {
      fetchExistingMinutes();
    }
  }, [open, meetingId]);

  const fetchExistingMinutes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('meeting_minutes')
        .select('*')
        .eq('meeting_id', meetingId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setMinutes({
          id: data.id,
          summary: data.summary || '',
          discussionPoints: data.discussion_points || '',
          decisions: data.decisions || '',
          nextSteps: data.next_steps || '',
          internalNotes: data.internal_notes || '',
          visibleToClient: data.visible_to_client ?? true,
        });
      }
    } catch (err) {
      console.error('Error fetching minutes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!minutes.summary?.trim()) {
      toast({ title: 'Campo obrigatório', description: 'O resumo da reunião é obrigatório.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        meeting_id: meetingId,
        summary: minutes.summary,
        discussion_points: minutes.discussionPoints,
        decisions: minutes.decisions,
        next_steps: minutes.nextSteps,
        internal_notes: minutes.internalNotes,
        visible_to_client: minutes.visibleToClient,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (minutes.id) {
        const { error } = await supabase
          .from('meeting_minutes')
          .update(payload)
          .eq('id', minutes.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('meeting_minutes')
          .insert({
            ...payload,
            created_by: user?.id,
          });
        if (error) throw error;
      }

      // Log activity
      await supabase.from('meeting_status_history').insert({
        meeting_id: meetingId,
        action: minutes.id ? 'minutes_updated' : 'minutes_created',
        new_status: 'realizada', 
        changed_by: user?.id,
        change_reason: minutes.id ? 'Ata atualizada' : 'Ata registrada'
      });

      // Update timeline
      const { data: meetingData } = await supabase.from('meetings').select('client_id').eq('id', meetingId).single();
      if (meetingData) {
        await supabase.from('timeline_events').insert({
          client_id: meetingData.client_id,
          meeting_id: meetingId,
          type: 'reuniao',
          title: `Ata registrada: ${meetingTitle}`,
          description: minutes.summary || '',
          date: new Date().toISOString(),
          status: 'realizada'
        } as any);
      }

      toast({ title: 'Sucesso', description: 'Ata registrada com sucesso.' });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving minutes:', err);
      toast({ title: 'Erro', description: 'Não foi possível salvar a ata.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal 
      open={open} 
      onClose={onClose} 
      titulo="Registrar Ata de Reunião" 
      descricao={meetingTitle}
      size="lg"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Buscando ata existente...</p>
        </div>
      ) : (
        <div className="space-y-6 pb-6 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Info className="h-3 w-3" /> Resumo da Reunião *
              </Label>
              <Textarea 
                placeholder="Uma visão geral do que foi tratado..." 
                value={minutes.summary || ''}
                onChange={e => setMinutes(prev => ({ ...prev, summary: e.target.value }))}
                className="min-h-[100px] text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Users className="h-3 w-3" /> Pontos Discutidos
              </Label>
              <Textarea 
                placeholder="Principais tópicos e discussões..." 
                value={minutes.discussionPoints || ''}
                onChange={e => setMinutes(prev => ({ ...prev, discussionPoints: e.target.value }))}
                className="min-h-[100px] text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" /> Decisões Tomadas
              </Label>
              <Textarea 
                placeholder="Quais foram as deliberações..." 
                value={minutes.decisions || ''}
                onChange={e => setMinutes(prev => ({ ...prev, decisions: e.target.value }))}
                className="min-h-[80px] text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <ListChecks className="h-3 w-3" /> Próximos Passos
              </Label>
              <Textarea 
                placeholder="Ações a serem tomadas após a reunião..." 
                value={minutes.nextSteps || ''}
                onChange={e => setMinutes(prev => ({ ...prev, nextSteps: e.target.value }))}
                className="min-h-[80px] text-sm"
              />
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-amber-800 flex items-center gap-2">
                  <Lock className="h-3 w-3" /> Observações Internas
                </Label>
                <Textarea 
                  placeholder="Anotações visíveis apenas para a equipe Seven..." 
                  value={minutes.internalNotes || ''}
                  onChange={e => setMinutes(prev => ({ ...prev, internalNotes: e.target.value }))}
                  className="min-h-[80px] text-sm bg-white border-amber-200 focus-visible:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-amber-900">Visível para o cliente?</Label>
                  <p className="text-[10px] text-amber-700">O cliente terá acesso a esta ata (exceto notas internas) no portal.</p>
                </div>
                <Switch 
                  checked={minutes.visibleToClient} 
                  onCheckedChange={v => setMinutes(prev => ({ ...prev, visibleToClient: v }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleSave} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Ata
            </Button>
          </div>
        </div>
      )}
    </BaseModal>
  );
};
