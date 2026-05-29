import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload } from 'lucide-react';

interface MaterialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phaseId?: string;
  material?: any;
}

export function MaterialForm({ open, onOpenChange, phaseId, material }: MaterialFormProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'material',
    url: '',
    is_essential: false,
    status: 'active',
    type: 'pdf',
  });

  // Reset form when material changes or modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        title: material?.title || '',
        description: material?.description || '',
        category: material?.category || 'material',
        url: material?.url || '',
        is_essential: material?.is_essential || false,
        status: material?.status || 'active',
        type: material?.type || 'pdf',
      });
      setFile(null);
    }
  }, [open, material]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let fileUrl = formData.url;
      let fileData = {};

      if (file) {
        const fileExt = file.name.split('.').pop();
        const cleanFileName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const fileName = `${Date.now()}_${cleanFileName}.${fileExt}`;
        const filePath = `phases/${phaseId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('methodology-materials')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('methodology-materials')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileData = {
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          file_url: publicUrl,
        };
      }

      const payload = {
        ...formData,
        ...fileData,
        url: fileUrl,
        phase_id: phaseId,
      };

      if (material?.id) {
        const { error } = await supabase
          .from('methodology_materials')
          .update(payload)
          .eq('id', material.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('methodology_materials')
          .insert([payload]);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['methodology-phases-crud'] });
      toast({ title: 'Sucesso', description: 'Material salvo com sucesso.' });
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{material ? 'Editar Material' : 'Novo Material'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input 
              id="title" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select 
              value={formData.category} 
              onValueChange={v => setFormData({...formData, category: v})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="material">Material</SelectItem>
                <SelectItem value="template">Template</SelectItem>
                <SelectItem value="pergunta_chave">Pergunta-chave</SelectItem>
                <SelectItem value="alerta">Alerta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Arquivo</Label>
            <div className="flex items-center gap-2">
              <Input id="file" type="file" onChange={handleFileChange} className="hidden" />
              <Button type="button" variant="outline" onClick={() => document.getElementById('file')?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                {file ? file.name : 'Selecionar arquivo'}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Ou insira um link externo abaixo:</p>
            <Input 
              placeholder="https://..." 
              value={formData.url} 
              onChange={e => setFormData({...formData, url: e.target.value})} 
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="essential" 
              checked={formData.is_essential} 
              onCheckedChange={v => setFormData({...formData, is_essential: !!v})} 
            />
            <Label htmlFor="essential">Marcar como essencial</Label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
