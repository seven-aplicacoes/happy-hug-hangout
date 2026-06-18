import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { FileText, Briefcase, ListChecks, Cloud } from 'lucide-react';

const SECTIONS = [
  { id: 'ficha-cadastral', label: 'Ficha Cadastral', icon: FileText },
  { id: 'contratos-jornada', label: 'Contratos e Jornada', icon: Briefcase },
  { id: 'tarefas-cliente', label: 'Tarefas do Cliente', icon: ListChecks },
  { id: 'onedrive-cliente', label: 'OneDrive do Cliente', icon: Cloud },
];

export function ClienteSectionNav() {
  const [active, setActive] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const handler = () => {
      const offset = 160;
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top - offset <= 0) {
          current = s.id;
        }
      }
      setActive(current);
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return (
    <div className="sticky top-0 z-30 -mx-4 px-4 bg-background/85 backdrop-blur-md border-b border-border/60">
      <nav className="max-w-7xl mx-auto flex gap-1 overflow-x-auto py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
