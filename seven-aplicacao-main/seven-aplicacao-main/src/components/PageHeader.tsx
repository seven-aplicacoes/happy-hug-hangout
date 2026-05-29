import { cn } from '@/lib/utils';

interface PageHeaderProps {
  titulo: string;
  subtitulo?: string;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader = ({ titulo, subtitulo, children, className }: PageHeaderProps) => (
  <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8 pb-6 border-b border-border/60', className)}>
    <div className="space-y-1.5 min-w-0">
      <h1 className="text-3xl sm:text-[2rem] font-thin text-foreground leading-[1.1] tracking-tight">
        {titulo}
      </h1>
      {subtitulo && (
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{subtitulo}</p>
      )}
    </div>
    {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
  </div>
);
