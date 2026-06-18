import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GripVertical, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ClientSectionKey, DEFAULT_SECTION_ORDER, useClientPageSectionOrder } from '@/hooks/useClientPageSectionOrder';

const LABELS: Record<ClientSectionKey, string> = {
  ficha_cadastral: 'Ficha Cadastral',
  contratos_jornada: 'Contratos e Jornada',
  tarefas_cliente: 'Tarefas do Cliente',
  onedrive_cliente: 'OneDrive do Cliente',
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function OrganizeFichaModal({ open, onOpenChange }: Props) {
  const { order, save, reset, saving, resetting } = useClientPageSectionOrder();
  const { toast } = useToast();
  const [local, setLocal] = useState<ClientSectionKey[]>(order);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => { if (open) setLocal(order); }, [open, order]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= local.length) return;
    const next = [...local];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setLocal(next);
  };

  const handleSave = async () => {
    try {
      await save(local);
      toast({ title: 'Ordem da ficha atualizada com sucesso.' });
      onOpenChange(false);
    } catch {
      toast({ title: 'Não foi possível salvar a ordem. Tente novamente.', variant: 'destructive' });
    }
  };

  const handleReset = async () => {
    try {
      await reset();
      setLocal(DEFAULT_SECTION_ORDER);
      toast({ title: 'Ordem padrão restaurada.' });
    } catch {
      toast({ title: 'Não foi possível restaurar. Tente novamente.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Organizar Ficha do Cliente</DialogTitle>
          <DialogDescription>
            Defina a ordem em que as seções aparecem na ficha. Essa preferência será aplicada às fichas que você visualizar.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 my-2">
          {local.map((key, i) => (
            <li
              key={key}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex === null || dragIndex === i) return;
                move(dragIndex, i);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/40 transition ${dragIndex === i ? 'opacity-50' : ''}`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <span className="flex-1 font-medium text-sm">{LABELS[key]}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Mover para cima">
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === local.length - 1} onClick={() => move(i, i + 1)} aria-label="Mover para baixo">
                <ArrowDown className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleReset} disabled={resetting} className="sm:mr-auto">
            <RotateCcw className="h-4 w-4 mr-2" /> Restaurar padrão
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>Salvar ordem</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
