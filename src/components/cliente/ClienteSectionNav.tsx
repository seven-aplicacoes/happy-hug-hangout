import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { FileText, Briefcase, ListChecks, Cloud, type LucideIcon } from 'lucide-react';
import { useFichaSectionOrder, DEFAULT_FICHA_SECTIONS, type FichaSectionKey } from '@/hooks/useFichaSectionOrder';

const SECTION_META: Record<FichaSectionKey, { anchorId: string; icon: LucideIcon }> = {
  ficha_cadastral: { anchorId: 'ficha-cadastral', icon: FileText },
  contratos_jornada: { anchorId: 'contratos-jornada', icon: Briefcase },
  tarefas_cliente: { anchorId: 'tarefas-cliente', icon: ListChecks },
  onedrive_cliente: { anchorId: 'onedrive-cliente', icon: Cloud },
};

export function ClienteSectionNav() {
  const { sections } = useFichaSectionOrder();
  const ordered = sections.length
    ? sections
    : DEFAULT_FICHA_SECTIONS.map((s, i) => ({ ...s, id: `default-${i}` }));

  const items = ordered.map(s => {
    const meta = SECTION_META[s.section_key as FichaSectionKey];
    return meta ? { id: meta.anchorId, label: s.section_label, icon: meta.icon } : null;
  }).filter(Boolean) as { id: string; label: string; icon: LucideIcon }[];

  const [active, setActive] = useState<string>(items[0]?.id ?? '');

  useEffect(() => {
    if (!items.length) return;
    const handler = () => {
      const offset = 160;
      let current = items[0].id;
      for (const s of items) {
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
  }, [items.map(i => i.id).join(',')]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return (
    <div className="sticky top-0 z-30 -mx-4 px-4 bg-background/85 backdrop-blur-md border-b border-border/60">
      <nav className="max-w-7xl mx-auto flex gap-1 overflow-x-auto py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {items.map((s) => {
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
