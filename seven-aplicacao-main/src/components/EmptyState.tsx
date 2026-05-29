import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
  titulo: string;
  descricao?: string;
}

export const EmptyState = ({ titulo, descricao }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <InboxIcon className="h-12 w-12 text-muted-foreground/40 mb-4" />
    <p className="font-medium text-foreground">{titulo}</p>
    {descricao && <p className="text-sm text-muted-foreground mt-1">{descricao}</p>}
  </div>
);
