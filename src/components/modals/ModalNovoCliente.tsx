import { useState } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientes } from '@/hooks/useClientes';
import { useConsultores } from '@/hooks/useConsultores';
import { useContratos } from '@/hooks/useContratos';
import { Loader2, Shield, Mail, Key, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ModalNovoCliente = ({ open, onClose }: Props) => {
  const { upsertCliente } = useClientes();
  const { consultores: allConsultores, isLoading: loadingConsultores } = useConsultores();
  const consultores = allConsultores?.filter(c => c.role === 'consultor');
  const { upsertContrato } = useContratos();

  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    razaoSocial: '', nomeFantasia: '', cnpj: '', clinicSpecialty: '', regiao: 'sudeste',
    porte: '' as any,
    consultorId: '',
    cep: '', street: '', number: '', complement: '', neighborhood: '',
    institutional_email: '',
    liberarPortal: false, emailPortal: '', senhaPortal: '',
  });

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSalvar = async () => {
    if (!form.razaoSocial.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe a Razão Social.", variant: "destructive" });
      return;
    }
    if (!form.nomeFantasia.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe o Nome Fantasia.", variant: "destructive" });
      return;
    }
    const cleanCnpj = form.cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      toast({ title: "CNPJ inválido", description: "O CNPJ deve conter 14 dígitos.", variant: "destructive" });
      return;
    }
    if (!form.consultorId) {
      toast({ title: "Campo obrigatório", description: "Selecione um Consultor Responsável.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const result = await upsertCliente.mutateAsync({
        razaoSocial: form.razaoSocial,
        nomeFantasia: form.nomeFantasia,
        cnpj: form.cnpj,
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
        razaoSocial: '', nomeFantasia: '', cnpj: '', segmento: '', regiao: 'sudeste',
        porte: '' as any,
        especialidade: 'gestao', consultorId: '',
        cep: '', street: '', number: '', complement: '', neighborhood: '',
        institutional_email: '',
        temContrato: false, tipoContrato: '', valorContrato: '', dataInicio: '', dataFim: '',
        liberarPortal: false, emailPortal: '', senhaPortal: '',
      });
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
          <Label>Razão Social *</Label>
          <Input value={form.razaoSocial} onChange={e => set('razaoSocial', e.target.value)} placeholder="Razão social completa" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <Label>Nome Fantasia *</Label>
            <Input value={form.nomeFantasia} onChange={e => set('nomeFantasia', e.target.value)} placeholder="Nome fantasia" />
          </div>
          <div className="space-y-0.5">
            <Label>CNPJ *</Label>
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
            />
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
          </div>
        </div>

        <p className="text-xs font-semibold text-muted-foreground pt-2 flex items-center gap-2">
          <MapPin className="h-3 w-3" /> Endereço
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-0.5">
            <Label>CEP</Label>
            <Input value={form.cep} onChange={e => set('cep', e.target.value)} placeholder="00000-000" />
          </div>
          <div className="col-span-2 space-y-0.5">
            <Label>Logradouro</Label>
            <Input value={form.street} onChange={e => set('street', e.target.value)} placeholder="Rua, Av, etc" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-0.5">
            <Label>Número</Label>
            <Input value={form.number} onChange={e => set('number', e.target.value)} />
          </div>
          <div className="col-span-2 space-y-0.5">
            <Label>Complemento</Label>
            <Input value={form.complement} onChange={e => set('complement', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <Label>Bairro</Label>
            <Input value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} />
          </div>
          <div className="space-y-0.5">
            <Label>Região</Label>
            <Select value={form.regiao} onValueChange={v => set('regiao', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="norte">Norte</SelectItem>
                <SelectItem value="nordeste">Nordeste</SelectItem>
                <SelectItem value="centro_oeste">Centro-Oeste</SelectItem>
                <SelectItem value="sudeste">Sudeste</SelectItem>
                <SelectItem value="sul">Sul</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-xs font-semibold text-muted-foreground  pt-2">Dados Operacionais</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <Label>Segmento</Label>
            <Input value={form.segmento} onChange={e => set('segmento', e.target.value)} placeholder="Ex: Tecnologia" />
          </div>
          <div className="space-y-0.5">
            <Label>Responsável *</Label>
            <Select value={form.consultorId} onValueChange={v => set('consultorId', v)}>
              <SelectTrigger><SelectValue placeholder={loadingConsultores ? "Carregando..." : "Selecione..."} /></SelectTrigger>
              <SelectContent>
                {consultores && consultores.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input type="checkbox" id="temContrato" checked={form.temContrato} onChange={e => set('temContrato', e.target.checked)} className="rounded" />
          <Label htmlFor="temContrato" className="cursor-pointer">Incluir contrato inicial</Label>
        </div>
        {form.temContrato && (
          <div className="space-y-3 p-3 rounded-md border bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <Label>Tipo *</Label>
                <Input value={form.tipoContrato} onChange={e => set('tipoContrato', e.target.value)} placeholder="Ex: Consultoria Estratégica" />
              </div>
              <div className="space-y-0.5">
                <Label>Valor *</Label>
                <Input value={form.valorContrato} onChange={e => set('valorContrato', e.target.value)} placeholder="R$ 0,00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <Label>Data Início *</Label>
                <Input type="date" value={form.dataInicio} onChange={e => set('dataInicio', e.target.value)} />
              </div>
              <div className="space-y-0.5">
                <Label>Data Fim *</Label>
                <Input type="date" value={form.dataFim} onChange={e => set('dataFim', e.target.value)} />
              </div>
            </div>
          </div>
        )}

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
