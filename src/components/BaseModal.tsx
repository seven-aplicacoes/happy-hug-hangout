import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

export const BaseModal = ({ open, onClose, titulo, descricao, children, footer, size = 'md' }: BaseModalProps) => (
  <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className={cn(sizes[size], "flex flex-col max-h-[90vh]")}>
      <DialogHeader className="shrink-0">
        <DialogTitle>{titulo}</DialogTitle>
        {descricao && <DialogDescription>{descricao}</DialogDescription>}
      </DialogHeader>
      
      <div className="flex-1 overflow-y-auto pr-2 min-h-0">
        {children}
      </div>

      {footer && (
        <DialogFooter className="mt-4 pt-4 border-t shrink-0">
          {footer}
        </DialogFooter>
      )}
    </DialogContent>
  </Dialog>
);
