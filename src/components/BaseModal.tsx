import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

export const BaseModal = ({ open, onClose, titulo, descricao, children, size = 'md' }: BaseModalProps) => (
  <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className={cn(sizes[size])}>
      <DialogHeader>
        <DialogTitle>{titulo}</DialogTitle>
        {descricao && <DialogDescription>{descricao}</DialogDescription>}
      </DialogHeader>
      {children}
    </DialogContent>
  </Dialog>
);
