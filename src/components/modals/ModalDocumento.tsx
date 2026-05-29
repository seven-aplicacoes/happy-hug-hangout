import { useState, useEffect, useRef } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDocumentos } from '@/hooks/useDocumentos';
import { useClientes } from '@/hooks/useClientes';
import { useClientProducts } from '@/hooks/useClientProducts';
import { useContractProductPhases } from '@/hooks/useContractProductPhases';
import { labelTipoDoc } from '@/data/documentos';
import { FileUp, File, X, Loader2 } from 'lucide-react';
import type { Documento } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  documento?: Documento | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/jpg'
];

export const ModalDocumento = ({ open, onClose, documento }: Props) => {
  const { upsertDocumento } = useDocumentos();
  const { clientes } = useClientes();
  const { clientProducts } = useClientProducts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('ata');
  const [clienteId, setClienteId] = useState('');
  const [contractProductId, setContractProductId] = useState<string>('');
  const [contractProductPhaseId, setContractProductPhaseId] = useState<string>('');
  const [visibility, setVisibility] = useState<'internal' | 'client' | 'all'>('internal');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState('');

  const { phases: productPhases } = useContractProductPhases(contractProductId);

  useEffect(() => {
    if (documento) {
      setTitulo(documento.titulo);
      setTipo(documento.tipo);
      setClienteId(documento.clienteId);
      setContractProductId(documento.contractProductId || '');
      setContractProductPhaseId(documento.contractProductPhaseId || '');
      setVisibility(documento.visibility || 'internal');
      setExistingFileName(documento.file_name || documento.arquivo || '');
      setSelectedFile(null);
    } else {
      setTitulo('');
      setTipo('ata');
      setClienteId('');
      setContractProductId('');
      setContractProductPhaseId('');
      setVisibility('internal');
      setExistingFileName('');
      setSelectedFile(null);
    }
  }, [documento, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert('Arquivo muito grande. O limite é 10MB.');
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Formato de arquivo não permitido. Use PDF, Word, Excel ou Imagens.');
      return;
    }

    setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!titulo || !clienteId || !tipo) return;
    if (!documento && !selectedFile) {
      alert('Por favor, selecione um arquivo.');
      return;
    }

    const data: any = {
      id: documento?.id,
      titulo,
      tipo,
      clienteId,
      contractProductId: (contractProductId && contractProductId !== 'none') ? contractProductId : null,
      contractProductPhaseId: (contractProductPhaseId && contractProductPhaseId !== 'none') ? contractProductPhaseId : null,
      visibility,
      status: documento?.status || 'pendente',
      feedbacks: documento?.feedbacks || []
    };
    
    try {
      await upsertDocumento.mutateAsync({ doc: data, file: selectedFile || undefined });
      onClose();
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  const filteredProducts = clientProducts?.filter(p => p.clientId === clienteId) || [];

  return (
    <BaseModal open={open} onClose={onClose} titulo={documento ? "Editar Documento" : "Novo Documento"}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="space-y-1">
          <Label>Título do Documento *</Label>
          <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Ata de Reunião #01" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Cliente *</Label>
            <Select value={clienteId} onValueChange={v => {
              setClienteId(v);
              setContractProductId('');
              setContractProductPhaseId('');
            }}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {(clientes || []).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nomeFantasia || c.razaoSocial}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label>Produto Contratado (Opcional)</Label>
            <Select value={contractProductId || 'none'} onValueChange={v => {
              setContractProductId(v);
              setContractProductPhaseId('');
            }} disabled={!clienteId}>
              <SelectTrigger><SelectValue placeholder={clienteId ? "Selecione..." : "Selecione um cliente primeiro"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {filteredProducts.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.productNome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Módulo da Jornada (Opcional)</Label>
            <Select value={contractProductPhaseId || 'none'} onValueChange={setContractProductPhaseId} disabled={!contractProductId || contractProductId === 'none'}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {(productPhases || []).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(labelTipoDoc).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label>Visibilidade *</Label>
          <Select value={visibility} onValueChange={(v: any) => {
            setVisibility(v);
            // Auto-adjust type based on visibility if it's one of the module types
            if (v === 'client') {
              setTipo('entregavel_metodologico');
            } else if (v === 'internal') {
              setTipo('materiais_apoio');
            }
          }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="internal">Interno (Apenas Seven)</SelectItem>
              <SelectItem value="client">Cliente</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Arquivo *</Label>
          <div className="flex flex-col gap-2">
            {!selectedFile && existingFileName && (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                <File className="w-4 h-4 text-primary" />
                <span className="text-sm flex-1 truncate">{existingFileName}</span>
                <span className="text-xs text-muted-foreground">(Arquivo atual)</span>
              </div>
            )}
            
            {selectedFile ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-primary/5 border-primary/20">
                <File className="w-4 h-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={removeFile} className="h-8 w-8 text-destructive">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/20"
              >
                <FileUp className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  Clique ou arraste para enviar<br />
                  <span className="text-xs">(PDF, Word, Excel ou Imagens até 10MB)</span>
                </p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={upsertDocumento.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!titulo || !clienteId || upsertDocumento.isPending}>
            {upsertDocumento.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Documento'
            )}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};