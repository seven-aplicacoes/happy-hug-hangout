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
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const sizes = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  '2xl': 'sm:max-w-[1200px] w-[85vw]',
  full: 'sm:max-w-[95vw] w-[95vw]',
};

export const BaseModal = ({ open, onClose, titulo, descricao, children, footer, size = 'md' }: BaseModalProps) => (
  <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className={cn(sizes[size], "flex flex-col max-h-[92vh] h-full p-0 overflow-hidden")}>
      <DialogHeader className="p-6 pb-2 shrink-0">
        <DialogTitle>{titulo}</DialogTitle>
        {descricao && <DialogDescription>{descricao}</DialogDescription>}
      </DialogHeader>
      
      <div className="flex-1 overflow-y-auto px-6 min-h-0">
        {children}
      </div>

      {footer && (
        <DialogFooter className="p-6 pt-4 border-t shrink-0 sticky bottom-0 bg-white z-20">
          {footer}
        </DialogFooter>
      )}
    </DialogContent>
  </Dialog>
);
