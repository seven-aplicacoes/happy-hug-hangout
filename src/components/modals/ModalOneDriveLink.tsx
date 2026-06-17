import { useEffect, useState } from 'react';
import { z } from 'zod';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useClienteOneDriveLinks, type OneDriveLink } from '@/hooks/useClienteOneDriveLinks';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  clientId: string;
  link?: OneDriveLink | null;
}

const CATEGORIES = [
  { value: 'pasta_principal', label: 'Pasta principal' },
  { value: 'atas', label: 'Atas' },
  { value: 'documentos_internos', label: 'Documentos internos' },
  { value: 'entregaveis', label: 'Entregáveis' },
  { value: 'outros', label: 'Outros' },
];

const schema = z.object({
  title: z.string().trim().min(1, 'Informe um título para o link.').max(120),
  url: z
    .string()
    .trim()
    .min(1, 'Informe uma URL válida.')
    .url('Informe uma URL válida.')
    .refine(
      (v) => /onedrive|sharepoint|1drv\.ms|live\.com/i.test(v),
      'Aceite apenas links do OneDrive ou SharePoint.'
    ),
  category: z.string().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
});

export function ModalOneDriveLink({ open, onClose, clientId, link }: Props) {
  const { upsertLink } = useClienteOneDriveLinks(clientId);
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(link?.title || '');
      setUrl(link?.url || '');
      setCategory(link?.category || '');
      setDescription(link?.description || '');
    }
  }, [open, link]);

  const handleSave = async () => {
    const parsed = schema.safeParse({ title, url, category: category || null, description: description || null });
    if (!parsed.success) {
      toast({ variant: 'destructive', title: parsed.error.errors[0].message });
      return;
    }
    await upsertLink.mutateAsync({
      id: link?.id,
      client_id: clientId,
      title: parsed.data.title,
      url: parsed.data.url,
      category: parsed.data.category ?? null,
      description: parsed.data.description ?? null,
    });
    onClose();
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      titulo={link ? 'Editar link do OneDrive' : 'Adicionar link do OneDrive'}
      descricao="Vincule pastas e arquivos do OneDrive/SharePoint a este cliente."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={upsertLink.isPending}>
            {upsertLink.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-4">
        <div className="space-y-1.5">
          <Label>Título *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Pasta principal do cliente" />
        </div>
        <div className="space-y-1.5">
          <Label>URL do OneDrive *</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://onedrive.live.com/..." />
        </div>
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Select value={category || 'none'} onValueChange={(v) => setCategory(v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem categoria</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Observação</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Opcional" />
        </div>
      </div>
    </BaseModal>
  );
}
