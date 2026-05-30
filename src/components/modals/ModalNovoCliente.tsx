import { useState } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientes } from '@/hooks/useClientes';
import { useConsultores } from '@/hooks/useConsultores';

import { Loader2, Shield, Mail, Key, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ModalNovoCliente = ({ open, onClose }: Props) => {
  const { upsertCliente } = useClientes();
  const { consultores: allConsultores, isLoading: loadingConsultores } = useConsultores();
  const consultores = allConsultores?.filter(c => c.role === 'consultor');

  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    razaoSocial: '', nomeFantasia: '', cnpj: '', clinicSpecialty: '', regiao: 'sudeste',
    porte: '' as any,
    consultorId: '',
    cep: '', street: '', number: '', complement: '', neighborhood: '',
    email: '', institutional_email: '', contact_phone: '',
    liberarPortal: false, emailPortal: '', senhaPortal: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: any) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const validate = async () => {
    const newErrors: Record<string, string> = {};
    if (!form.razaoSocial.trim()) newErrors.razaoSocial = "Razão social é obrigatória.";
    if (!form.nomeFantasia.trim()) newErrors.nomeFantasia = "Nome fantasia é obrigatório.";
    
    const cleanCnpj = form.cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      newErrors.cnpj = "Informe um CNPJ válido.";
    } else {
      const { data: existingCnpj } = await supabase.from('clients').select('id').eq('cnpj', form.cnpj).maybeSingle();
      if (existingCnpj) newErrors.cnpj = "Este CNPJ já está cadastrado.";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Informe um e-mail válido.";
    }
    
    if (!form.consultorId) newErrors.consultorId = "Selecione um responsável interno.";
    
    if (!form.cep.trim()) newErrors.cep = "CEP é obrigatório.";
    if (!form.street.trim()) newErrors.street = "Logradouro é obrigatório.";
    if (!form.number.trim()) newErrors.number = "Número é obrigatório.";
    if (!form.neighborhood.trim()) newErrors.neighborhood = "Bairro é obrigatório.";
    if (!form.regiao) newErrors.regiao = "Região é obrigatória.";
    if (!form.porte) newErrors.porte = "Porte é obrigatório.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSalvar = async () => {
    setIsLoading(true);
    const isValid = await validate();
    if (!isValid) {
      setIsLoading(false);
      toast({ title: "Erro na validação", description: "Por favor, corrija os campos destacados.", variant: "destructive" });
      return;
    }
    try {
      const result = await upsertCliente.mutateAsync({
        razaoSocial: form.razaoSocial,
        nomeFantasia: form.nomeFantasia,
        cnpj: form.cnpj,
        email: form.email,
        contact_phone: form.contact_phone,
        clinicSpecialty: form.clinicSpecialty,
        regiao: form.regiao as any,
        porte: form.porte,
        consultorId: form.consultorId,
        cep: form.cep,
        street: form.street,
        number: form.number,
        complement: form.complement,
        neighborhood: form.neighborhood,
        institutional_email: form.institutional_email,
        faseMetodologica: 'diagnostico',
      });
      
      if (form.liberarPortal && result?.[0]?.id) {
        const { error: portalError } = await supabase.functions.invoke("manage-client-access", {
          body: {
            clientId: result[0].id,
            email: form.emailPortal,
            password: form.senhaPortal,
            action: "create"
          }
        });
        
        if (portalError) {
          toast({ 
            title: "Atenção", 
            description: "Cliente criado, mas houve um erro ao liberar o portal: " + portalError.message,
            variant: "destructive"
          });
        }
      }

      onClose();
      setForm({
        razaoSocial: '', nomeFantasia: '', cnpj: '', clinicSpecialty: '', regiao: 'sudeste',
        porte: '' as any,
        consultorId: '',
        cep: '', street: '', number: '', complement: '', neighborhood: '',
        email: '', institutional_email: '', contact_phone: '',
        liberarPortal: false, emailPortal: '', senhaPortal: '',
      });
      setErrors({});
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal open={open} onClose={onClose} titulo="Novo Cliente" descricao="Cadastre um novo cliente na plataforma">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <p className="text-xs font-semibold text-muted-foreground ">Dados Básicos</p>
        <div className="space-y-0.5">
          <Label className={cn(errors.razaoSocial && "text-destructive")}>Razão Social *</Label>
          <Input value={form.razaoSocial} onChange={e => set('razaoSocial', e.target.value)} placeholder="Razão social completa" className={cn(errors.razaoSocial && "border-destructive")} />
          {errors.razaoSocial && <p className="text-[10px] text-destructive font-medium">{errors.razaoSocial}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <Label className={cn(errors.nomeFantasia && "text-destructive")}>Nome Fantasia *</Label>
            <Input value={form.nomeFantasia} onChange={e => set('nomeFantasia', e.target.value)} placeholder="Nome fantasia" className={cn(errors.nomeFantasia && "border-destructive")} />
            {errors.nomeFantasia && <p className="text-[10px] text-destructive font-medium">{errors.nomeFantasia}</p>}
          </div>
          <div className="space-y-0.5">
            <Label className={cn(errors.cnpj && "text-destructive")}>CNPJ *</Label>
            <Input 
              value={form.cnpj} 
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 14);
                const masked = val
                  .replace(/^(\d{2})(\d)/, '$1.$2')
                  .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                  .replace(/\.(\d{3})(\d)/, '.$1/$2')
                  .replace(/(\d{4})(\d)/, '$1-$2');
                set('cnpj', masked);
              }} 
              placeholder="00.000.000/0001-00" 
              className={cn(errors.cnpj && "border-destructive")}
            />
            {errors.cnpj && <p className="text-[10px] text-destructive font-medium">{errors.cnpj}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <Label>E-mail Institucional</Label>
            <Input value={form.institutional_email} onChange={e => set('institutional_email', e.target.value)} placeholder="Ex: contato@empresa.com" />
          </div>
          <div className="space-y-0.5">
            <Label>Porte da Empresa</Label>
            <Select value={form.porte} onValueChange={v => set('porte', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione o porte" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MEI">MEI</SelectItem>
                <SelectItem value="Micro">Micro</SelectItem>
                <SelectItem value="Pequena">Pequena</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Grande">Grande</SelectItem>
              </SelectContent>
            </Select>
            {errors.porte && <p className="text-[10px] text-destructive font-medium">{errors.porte}</p>}
          </div>
        </div>

        <p className="text-xs font-semibold text-muted-foreground pt-2 flex items-center gap-2">
          <MapPin className="h-3 w-3" /> Endereço
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-0.5">
            <Label className={cn(errors.cep && "text-destructive")}>CEP *</Label>
            <Input value={form.cep} onChange={e => set('cep', e.target.value)} placeholder="00000-000" className={cn(errors.cep && "border-destructive")} />
            {errors.cep && <p className="text-[10px] text-destructive font-medium">{errors.cep}</p>}
          </div>
          <div className="col-span-2 space-y-0.5">
            <Label className={cn(errors.street && "text-destructive")}>Logradouro *</Label>
            <Input value={form.street} onChange={e => set('street', e.target.value)} placeholder="Rua, Av, etc" className={cn(errors.street && "border-destructive")} />
            {errors.street && <p className="text-[10px] text-destructive font-medium">{errors.street}</p>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-0.5">
            <Label className={cn(errors.number && "text-destructive")}>Número *</Label>
            <Input value={form.number} onChange={e => set('number', e.target.value)} className={cn(errors.number && "border-destructive")} />
            {errors.number && <p className="text-[10px] text-destructive font-medium">{errors.number}</p>}
          </div>
          <div className="col-span-2 space-y-0.5">
            <Label>Complemento</Label>
            <Input value={form.complement} onChange={e => set('complement', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <Label className={cn(errors.neighborhood && "text-destructive")}>Bairro *</Label>
            <Input value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} className={cn(errors.neighborhood && "border-destructive")} />
            {errors.neighborhood && <p className="text-[10px] text-destructive font-medium">{errors.neighborhood}</p>}
          </div>
          <div className="space-y-0.5">
            <Label className={cn(errors.regiao && "text-destructive")}>Região *</Label>
            <Select value={form.regiao} onValueChange={v => set('regiao', v)}>
              <SelectTrigger className={cn(errors.regiao && "border-destructive")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="norte">Norte</SelectItem>
                <SelectItem value="nordeste">Nordeste</SelectItem>
                <SelectItem value="centro_oeste">Centro-Oeste</SelectItem>
                <SelectItem value="sudeste">Sudeste</SelectItem>
                <SelectItem value="sul">Sul</SelectItem>
              </SelectContent>
            </Select>
            {errors.regiao && <p className="text-[10px] text-destructive font-medium">{errors.regiao}</p>}
          </div>
        </div>

        <p className="text-xs font-semibold text-muted-foreground  pt-2">Dados Operacionais</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <Label>Especialidade da clínica</Label>
            <Input value={form.clinicSpecialty} onChange={e => set('clinicSpecialty', e.target.value)} placeholder="Ex: Dermatologia, Odontologia, Oftalmologia" />
          </div>
          <div className="space-y-0.5">
            <Label className={cn(errors.consultorId && "text-destructive")}>Responsável *</Label>
            <Select value={form.consultorId} onValueChange={v => set('consultorId', v)}>
              <SelectTrigger className={cn(errors.consultorId && "border-destructive")}><SelectValue placeholder={loadingConsultores ? "Carregando..." : "Selecione..."} /></SelectTrigger>
              <SelectContent>
                {consultores && consultores.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.consultorId && <p className="text-[10px] text-destructive font-medium">{errors.consultorId}</p>}
          </div>
        </div>

        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Liberar Acesso ao Portal (Contato Principal)
              </Label>
            </div>
            <Switch checked={form.liberarPortal} onCheckedChange={v => set('liberarPortal', v)} />
          </div>

          {form.liberarPortal && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-md border bg-primary/5">
              <div className="space-y-1.5">
                <Label className="text-xs">E-mail de Login</Label>
                <Input type="email" value={form.emailPortal} onChange={e => set('emailPortal', e.target.value)} placeholder="email@cliente.com" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Senha Temporária</Label>
                <Input type="password" value={form.senhaPortal} onChange={e => set('senhaPortal', e.target.value)} placeholder="••••••••" className="h-8 text-xs" />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSalvar} disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Cadastrar Cliente
        </Button>
      </div>
    </BaseModal>
  );
};
