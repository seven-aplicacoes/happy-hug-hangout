import { useState } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}

export const ModalRegistrarImpedimento = ({ open, onClose, onConfirm, isSubmitting }: Props) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason);
    setReason('');
  };

  return (
    <BaseModal 
      open={open} 
      onClose={onClose} 
      titulo="Registrar Impedimento"
    >
      <div className="space-y-4 pt-2">
        <p className="text-sm text-muted-foreground">
          Informe o motivo do impedimento desta tarefa.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="impediment-reason">Motivo do impedimento *</Label>
          <Textarea
            id="impediment-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Descreva o que está impedindo a tarefa..."
            rows={4}
            className="resize-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!reason.trim() || isSubmitting}
            className="min-w-[150px]"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Confirmar Impedimento"
            )}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};