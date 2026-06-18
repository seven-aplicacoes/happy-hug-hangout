import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFichaSectionOrder, type FichaSection } from '@/hooks/useFichaSectionOrder';
import { useToast } from '@/hooks/use-toast';

export default function AdminFichaOrderPage() {
  const { sections, isLoading, saveOrder } = useFichaSectionOrder();
  const [items, setItems] = useState<FichaSection[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (sections.length) setItems(sections);
  }, [sections]);

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  const handleSave = async () => {
    try {
      await saveOrder.mutateAsync(
        items.map((s, i) => ({ section_key: s.section_key, display_order: i + 1 }))
      );
      toast({ title: 'Ordem da ficha salva com sucesso.' });
    } catch {
      toast({
        title: 'Não foi possível salvar a ordem. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight">Ordem da Ficha do Cliente</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Defina a ordem em que as seções aparecem na Ficha do Cliente.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seções</CardTitle>
          <CardDescription>Use as setas para reordenar. Clique em salvar para aplicar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((s, i) => (
            <div
              key={s.section_key}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-primary/10 text-primary text-xs font-bold">
                  {i + 1}
                </span>
                <span className="font-semibold text-sm">{s.section_label}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Subir"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  aria-label="Descer"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveOrder.isPending}>
          {saveOrder.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar ordem
        </Button>
      </div>
    </div>
  );
}
