import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';

interface PhaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase?: any;
}

export function PhaseForm({ open, onOpenChange, phase }: PhaseFormProps) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: phase?.name || '',
    subtitle: phase?.subtitle || '',
    purpose: phase?.purpose || '',
    average_duration: phase?.average_duration || '',
    order_index: phase?.order_index || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (phase?.id) {
        const { error } = await supabase
          .from('methodology_phases')
          .update(formData)
          .eq('id', phase.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('methodology_phases')
          .insert([formData]);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ['methodology-phases-crud'] });
      toast({ title: 'Sucesso', description: 'Fase salva com sucesso.' });
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{phase ? 'Editar Fase' : 'Nova Fase'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração Média</Label>
              <Input 
                id="duration" 
                value={formData.average_duration} 
                onChange={e => setFormData({...formData, average_duration: e.target.value})} 
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
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
