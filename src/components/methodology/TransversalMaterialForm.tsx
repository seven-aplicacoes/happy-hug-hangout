import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload } from 'lucide-react';

interface TransversalMaterialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: any;
}

export function TransversalMaterialForm({ open, onOpenChange, material }: TransversalMaterialFormProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'metodologia',
    url: '',
    status: 'active',
    order_index: 0,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        title: material?.title || '',
        description: material?.description || '',
        category: material?.category || 'metodologia',
        url: material?.file_url || '',
        status: material?.status || 'active',
        order_index: material?.order_index || 0,
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
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `transversal/${fileName}`;

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
        file_url: fileUrl,
      };

      if (material?.id) {
        const { error } = await supabase
          .from('methodology_transversal_materials')
          .update(payload)
          .eq('id', material.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('methodology_transversal_materials')
          .insert([payload]);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['methodology-transversal'] });
      toast({ title: 'Sucesso', description: 'Material transversal salvo.' });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving transversal material:', error);
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{material ? 'Editar Material Transversal' : 'Novo Material Transversal'}</DialogTitle>
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
                <SelectItem value="cultura">Cultura Seven</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="metodologia">Metodologia</SelectItem>
                <SelectItem value="integracao">Integrações</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea 
              id="description" 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-transversal">Arquivo</Label>
            <div className="flex items-center gap-2">
              <Input id="file-transversal" type="file" onChange={handleFileChange} className="hidden" />
              <Button type="button" variant="outline" onClick={() => document.getElementById('file-transversal')?.click()}>
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
