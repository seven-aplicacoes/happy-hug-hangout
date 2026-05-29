import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';

interface PhaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase?: any;
}

export function PhaseForm({ open, onOpenChange, phase }: PhaseFormProps) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    purpose: '',
    average_duration: '',
    order_index: 0,
    phase_key: '',
  });

  const [objectives, setObjectives] = useState<{ id?: string, title: string }[]>([]);
  const [deliverables, setDeliverables] = useState<{ id?: string, title: string }[]>([]);
  const [tools, setTools] = useState<{ id?: string, name: string }[]>([]);

  // Reset form when phase changes or modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: phase?.name || '',
        subtitle: phase?.subtitle || '',
        purpose: phase?.purpose || '',
        average_duration: phase?.average_duration || '',
        order_index: phase?.order_index || 0,
        phase_key: phase?.phase_key || '',
      });
      setObjectives(phase?.objectives || []);
      setDeliverables(phase?.deliverables || []);
      setTools(phase?.tools || []);
    }
  }, [open, phase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let phaseId = phase?.id;

      if (phaseId) {
        const { error } = await supabase
          .from('methodology_phases')
          .update(formData)
          .eq('id', phaseId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('methodology_phases')
          .insert([formData])
          .select()
          .single();
        if (error) throw error;
        phaseId = data.id;
      }

      // Sync objectives
      if (phaseId) {
        await supabase.from('methodology_phase_objectives').delete().eq('phase_id', phaseId);
        if (objectives.length > 0) {
          const { error: objError } = await supabase.from('methodology_phase_objectives').insert(
            objectives.filter(o => o.title.trim()).map(o => ({ phase_id: phaseId, title: o.title }))
          );
          if (objError) throw objError;
        }

        await supabase.from('methodology_phase_deliverables').delete().eq('phase_id', phaseId);
        if (deliverables.length > 0) {
          const { error: delError } = await supabase.from('methodology_phase_deliverables').insert(
            deliverables.filter(d => d.title.trim()).map(d => ({ phase_id: phaseId, title: d.title }))
          );
          if (delError) throw delError;
        }

        await supabase.from('methodology_phase_tools').delete().eq('phase_id', phaseId);
        if (tools.length > 0) {
          const { error: toolError } = await supabase.from('methodology_phase_tools').insert(
            tools.filter(t => t.name.trim()).map(t => ({ phase_id: phaseId, name: t.name }))
          );
          if (toolError) throw toolError;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['methodology-phases-crud'] });
      toast({ title: 'Sucesso', description: 'Fase salva com sucesso.' });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving phase:', error);
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{phase ? 'Editar Fase' : 'Nova Fase'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Fase</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">Ordem</Label>
              <Input 
                id="order" 
                type="number" 
                value={formData.order_index} 
                onChange={e => setFormData({...formData, order_index: parseInt(e.target.value)})} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Input 
              id="subtitle" 
              value={formData.subtitle} 
              onChange={e => setFormData({...formData, subtitle: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Propósito/Descrição</Label>
            <Textarea 
              id="purpose" 
              value={formData.purpose} 
              onChange={e => setFormData({...formData, purpose: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duração Média</Label>
            <Input 
              id="duration" 
              value={formData.average_duration} 
              onChange={e => setFormData({...formData, average_duration: e.target.value})} 
              placeholder="Ex: 4 semanas"
            />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold">Objetivos</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setObjectives([...objectives, { title: '' }])}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {objectives.map((obj, i) => (
              <div key={i} className="flex gap-2">
                <Input 
                  value={obj.title} 
                  onChange={e => {
                    const newObjs = [...objectives];
                    newObjs[i].title = e.target.value;
                    setObjectives(newObjs);
                  }} 
                  placeholder="Título do objetivo"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setObjectives(objectives.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold">Entregáveis</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setDeliverables([...deliverables, { title: '' }])}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {deliverables.map((del, i) => (
              <div key={i} className="flex gap-2">
                <Input 
                  value={del.title} 
                  onChange={e => {
                    const newDels = [...deliverables];
                    newDels[i].title = e.target.value;
                    setDeliverables(newDels);
                  }} 
                  placeholder="Título do entregável"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setDeliverables(deliverables.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold">Ferramentas</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setTools([...tools, { name: '' }])}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {tools.map((tool, i) => (
              <div key={i} className="flex gap-2">
                <Input 
                  value={tool.name} 
                  onChange={e => {
                    const newTools = [...tools];
                    newTools[i].name = e.target.value;
                    setTools(newTools);
                  }} 
                  placeholder="Nome da ferramenta"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setTools(tools.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-6">
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Fase
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
