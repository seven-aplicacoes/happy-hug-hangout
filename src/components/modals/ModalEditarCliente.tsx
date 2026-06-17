import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useConsultores } from '@/hooks/useConsultores';
import { useClienteFicha } from '@/hooks/useClienteFicha';
import { Loader2, Plus, X, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Cliente, PorteEmpresa, Regiao, StatusContrato } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  cliente: Cliente;
}

export const ModalEditarCliente = ({ open, onClose, cliente }: Props) => {
  const { updateCliente } = useClienteFicha(cliente.id);
  const { consultores: allConsultores, isLoading: loadingConsultores } = useConsultores();
  const consultores = allConsultores?.filter(c => c.role === 'consultor' || c.role === 'admin');

  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    clinicSpecialty: '',
    regiao: '' as Regiao,
    porte: '' as PorteEmpresa,
    consultorId: '',
    status: '' as StatusContrato,
    faturamentoMensal: 0,
    current_objective: '',
    briefing: '',
    email: '',
    institutional_email: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
  });

  const [pains, setPains] = useState<string[]>([]);
  const [newPain, setNewPain] = useState('');
  const [successFactors, setSuccessFactors] = useState<string[]>([]);
  const [newSuccessFactor, setNewSuccessFactor] = useState('');

  useEffect(() => {
    if (cliente) {
      setForm({
        razaoSocial: cliente.razaoSocial || '',
        nomeFantasia: cliente.nomeFantasia || '',
        cnpj: cliente.cnpj || '',
        clinicSpecialty: cliente.clinicSpecialty || '',
        regiao: cliente.regiao || 'sudeste',
        porte: cliente.porte || 'Pequena',
        consultorId: cliente.consultorId || '',
        status: cliente.status || 'ativo',
        faturamentoMensal: cliente.faturamentoMensal || 0,
        current_objective: cliente.current_objective || '',
        briefing: cliente.briefing || '',
        email: cliente.email || '',
        institutional_email: cliente.institutional_email || '',
        cep: cliente.cep || '',
        street: cliente.street || '',
        number: cliente.number || '',
        complement: cliente.complement || '',
        neighborhood: cliente.neighborhood || '',
      });
      setPains(cliente.pains || []);
      setSuccessFactors(cliente.success_factors || []);
    }
  }, [cliente, open]);

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSalvar = async () => {
    setIsLoading(true);
    try {
      await updateCliente.mutateAsync({
        ...form,
        pains,
        success_factors: successFactors,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const addPain = () => {
    if (newPain.trim() && !pains.includes(newPain.trim())) {
      setPains([...pains, newPain.trim()]);
      setNewPain('');
    }
  };

  const removePain = (index: number) => {
    setPains(pains.filter((_, i) => i !== index));
  };

  const addSuccessFactor = () => {
    if (newSuccessFactor.trim() && !successFactors.includes(newSuccessFactor.trim())) {
      setSuccessFactors([...successFactors, newSuccessFactor.trim()]);
      setNewSuccessFactor('');
    }
  };

  const removeSuccessFactor = (index: number) => {
    setSuccessFactors(successFactors.filter((_, i) => i !== index));
  };

  return (
    <BaseModal 
      open={open} 
      onClose={onClose} 
      titulo="Editar Ficha do Cliente" 
      descricao="Atualize as informações completas do cliente"
      size="lg"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        {/* Identificação */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-primary/80 border-b pb-1">Identificação</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Razão Social</Label>
              <Input value={form.razaoSocial} onChange={e => set('razaoSocial', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Nome Fantasia</Label>
              <Input value={form.nomeFantasia} onChange={e => set('nomeFantasia', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>CNPJ</Label>
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
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail Principal</Label>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail Institucional</Label>
              <Input type="email" value={form.institutional_email} onChange={e => set('institutional_email', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-primary/80 border-b pb-1 flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Localização
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>CEP</Label>
              <Input value={form.cep} onChange={e => set('cep', e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Rua / Logradouro</Label>
              <Input value={form.street} onChange={e => set('street', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Número</Label>
              <Input value={form.number} onChange={e => set('number', e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Complemento</Label>
              <Input value={form.complement} onChange={e => set('complement', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Bairro</Label>
              <Input value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} />
            </div>
            <div className="space-y-1.5">
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
        </div>

        {/* Perfil do Negócio */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-primary/80 border-b pb-1">Perfil e Gestão</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Especialidade da clínica</Label>
              <Input value={form.clinicSpecialty} onChange={e => set('clinicSpecialty', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Porte da clínica</Label>
              <Select value={form.porte} onValueChange={v => set('porte', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEI">MEI</SelectItem>
                  <SelectItem value="Micro">Micro</SelectItem>
                  <SelectItem value="Pequena">Pequena</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Grande">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Consultor Responsável</Label>
              <Select value={form.consultorId} onValueChange={v => set('consultorId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingConsultores ? "Carregando..." : "Selecione..."} />
                </SelectTrigger>
                <SelectContent>
                  {consultores?.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status Geral</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="em_onboarding">Em Onboarding</SelectItem>
                  <SelectItem value="em_renovacao">Em Renovação</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="churn">Churn</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Estratégico */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-primary/80 border-b pb-1">Alinhamento Estratégico</h3>
          <div className="space-y-1.5">
            <Label>Objetivo Atual</Label>
            <Input value={form.current_objective} onChange={e => set('current_objective', e.target.value)} />
          </div>

          <div className="space-y-3">
            <Label>Dores / Problemas (Pains)</Label>
            <div className="flex gap-2">
              <Input value={newPain} onChange={e => setNewPain(e.target.value)} placeholder="Adicionar dor..." onKeyDown={e => e.key === 'Enter' && addPain()} />
              <Button type="button" size="icon" variant="outline" onClick={addPain}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-md bg-muted/30">
              {pains.map((pain, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {pain}
                  <button onClick={() => removePain(i)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Fatores de Sucesso</Label>
            <div className="flex gap-2">
              <Input value={newSuccessFactor} onChange={e => setNewSuccessFactor(e.target.value)} placeholder="Adicionar fator..." onKeyDown={e => e.key === 'Enter' && addSuccessFactor()} />
              <Button type="button" size="icon" variant="outline" onClick={addSuccessFactor}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-md bg-muted/30">
              {successFactors.map((sf, i) => (
                <Badge key={i} variant="default" className="gap-1 pr-1 bg-seven-success hover:bg-seven-success/90">
                  {sf}
                  <button onClick={() => removeSuccessFactor(i)} className="hover:text-white"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Briefing / Observações Gerais</Label>
            <Textarea value={form.briefing} onChange={e => set('briefing', e.target.value)} rows={4} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSalvar} disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Salvar Alterações
        </Button>
      </div>
    </BaseModal>
  );
};
