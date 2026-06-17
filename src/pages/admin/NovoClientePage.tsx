import { getFriendlyError } from '@/lib/friendlyErrors';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientes } from '@/hooks/useClientes';
import { useConsultores } from '@/hooks/useConsultores';
import { useContratos } from '@/hooks/useContratos';
import { Loader2, Shield, MapPin, ArrowLeft, Save, X, Plus, Trash2, Target, Search, Building2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { calcularPorteClinica } from '@/data/clienteExtras';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const REGIAO_BY_UF: Record<string, string> = {
  AC: 'norte', AP: 'norte', AM: 'norte', PA: 'norte', RO: 'norte', RR: 'norte', TO: 'norte',
  AL: 'nordeste', BA: 'nordeste', CE: 'nordeste', MA: 'nordeste', PB: 'nordeste', PE: 'nordeste', PI: 'nordeste', RN: 'nordeste', SE: 'nordeste',
  DF: 'centro_oeste', GO: 'centro_oeste', MT: 'centro_oeste', MS: 'centro_oeste',
  ES: 'sudeste', MG: 'sudeste', RJ: 'sudeste', SP: 'sudeste',
  PR: 'sul', RS: 'sul', SC: 'sul',
};

function maskCnpj(val: string) {
  return val.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function isValidCNPJ(cnpj: string): boolean {
  const c = cnpj.replace(/\D/g, '');
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const calc = (base: string, weights: number[]) => {
    const sum = base.split('').reduce((a, n, i) => a + parseInt(n) * weights[i], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, ...w1];
  return calc(c.slice(0, 12), w1) === parseInt(c[12]) && calc(c.slice(0, 13), w2) === parseInt(c[13]);
}

export default function NovoClientePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { perfil, user } = useAuth();
  const { upsertCliente } = useClientes();
  const { consultores: allConsultores, isLoading: loadingConsultores } = useConsultores();
  const consultores = allConsultores?.filter(c => c.role === 'consultor');
  const { upsertContrato } = useContratos();

  const isAdmin = perfil === 'admin';
  const basePath = isAdmin ? '/admin' : '/consultor';

  const OBJETIVO_MAX = 300;
  const BRIEFING_MAX = 500;
  const ITEM_MAX_CHARS = 80;
  const LIST_MAX_ITEMS = 5;

  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    razaoSocial: '', nomeFantasia: '', cnpj: '', regiao: 'sudeste',
    porte: '' as any,
    faturamentoMensal: '' as string,
    especialidade: 'gestao', consultorId: '',
    cep: '', street: '', number: '', complement: '', neighborhood: '',
    institutional_email: '',
    contact_name: '', contact_phone: '',
    current_objective: '', briefing: '',
    liberarPortal: false, emailPortal: '', senhaPortal: '',
  });
  const [pains, setPains] = useState<string[]>([]);
  const [successFactors, setSuccessFactors] = useState<string[]>([]);
  const [newPain, setNewPain] = useState('');
  const [newFactor, setNewFactor] = useState('');

  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjMessage, setCnpjMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [pendingLookup, setPendingLookup] = useState<any>(null);
  const [confirmOverwriteOpen, setConfirmOverwriteOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin && user?.id) {
      setForm(prev => ({ ...prev, consultorId: user.id }));
    }
  }, [isAdmin, user]);

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const applyLookup = (data: any, overwrite: boolean) => {
    setForm(prev => {
      const pick = (cur: string, next: string) => {
        if (!next) return cur;
        if (!cur || cur.trim() === '') return next;
        return overwrite ? next : cur;
      };
      return {
        ...prev,
        cnpj: data.cnpj || prev.cnpj,
        razaoSocial: pick(prev.razaoSocial, data.razao_social),
        nomeFantasia: pick(prev.nomeFantasia, data.nome_fantasia),
        institutional_email: pick(prev.institutional_email, data.email),
        contact_phone: pick(prev.contact_phone, data.telefone),
        porte: pick(prev.porte, data.porte) as any,
        cep: pick(prev.cep, data.cep),
        street: pick(prev.street, data.logradouro),
        number: pick(prev.number, data.numero),
        complement: pick(prev.complement, data.complemento),
        neighborhood: pick(prev.neighborhood, data.bairro),
        regiao: pick(prev.regiao, data.regiao) || prev.regiao,
      };
    });
  };

  const handleBuscarCnpj = async () => {
    setCnpjMessage(null);
    const clean = form.cnpj.replace(/\D/g, '');
    if (clean.length !== 14 || !isValidCNPJ(clean)) {
      setCnpjMessage({ type: 'error', text: 'Digite um CNPJ válido.' });
      return;
    }
    setCnpjLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('lookup-cnpj', { body: { cnpj: clean } });
      if (error || !data || (data as any).error) {
        const msg = (data as any)?.error === 'CNPJ não encontrado'
          ? 'CNPJ não encontrado.'
          : 'Não foi possível buscar os dados deste CNPJ. Preencha manualmente ou tente novamente.';
        setCnpjMessage({ type: 'error', text: msg });
        return;
      }
      const lookup = data as any;
      const camposComDados = [
        form.razaoSocial, form.nomeFantasia, form.institutional_email,
        form.contact_phone, form.cep, form.street, form.number,
        form.complement, form.neighborhood,
      ].some(v => (v || '').trim() !== '');

      if (camposComDados) {
        setPendingLookup(lookup);
        setConfirmOverwriteOpen(true);
      } else {
        applyLookup(lookup, true);
        setCnpjMessage({ type: 'success', text: 'Dados encontrados e preenchidos automaticamente.' });
      }
    } catch (_err) {
      setCnpjMessage({ type: 'error', text: 'Não foi possível consultar o CNPJ agora. Tente novamente ou preencha os dados manualmente.' });
    } finally {
      setCnpjLoading(false);
    }
  };

  const addItem = (list: string[], setList: (l: string[]) => void, value: string, reset: () => void, label: string) => {
    const v = value.trim();
    if (!v) return;
    if (list.length >= LIST_MAX_ITEMS) {
      toast({ title: 'Limite atingido', description: `Você pode adicionar até ${LIST_MAX_ITEMS} ${label}.`, variant: 'destructive' });
      return;
    }
    if (v.length > ITEM_MAX_CHARS) {
      toast({ title: 'Item muito longo', description: `Cada item deve ter no máximo ${ITEM_MAX_CHARS} caracteres.`, variant: 'destructive' });
      return;
    }
    setList([...list, v]);
    reset();
  };


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
    if (cleanCnpj.length !== 14 || !isValidCNPJ(cleanCnpj)) {
      toast({ title: "CNPJ inválido", description: "Digite um CNPJ válido.", variant: "destructive" });
      return;
    }
    if (!form.consultorId) {
      toast({ title: "Campo obrigatório", description: "Selecione um Consultor Responsável.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Duplicate CNPJ check (with or without mask)
      const masked = maskCnpj(cleanCnpj);
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .or(`cnpj.eq.${cleanCnpj},cnpj.eq.${masked}`)
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle();
      if (existing) {
        toast({
          title: 'Cliente já cadastrado',
          description: 'Já existe um cliente com este CNPJ. Verifique a listagem antes de criar um novo cadastro.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      const result = await upsertCliente.mutateAsync({
        razaoSocial: form.razaoSocial,
        nomeFantasia: form.nomeFantasia,
        cnpj: form.cnpj,
        regiao: form.regiao as any,
        porte: form.porte,
        consultorId: form.consultorId,
        cep: form.cep,
        street: form.street,
        number: form.number,
        complement: form.complement,
        neighborhood: form.neighborhood,
        institutional_email: form.institutional_email,
        contact_name: form.contact_name,
        contact_phone: form.contact_phone,
        current_objective: form.current_objective || null,
        briefing: form.briefing || null,
        pains,
        success_factors: successFactors,
        faseMetodologica: 'diagnostico',
      } as any);

      const clientId = result?.[0]?.id;

      if (clientId) {
        
        if (form.liberarPortal) {
          const { error: portalError } = await supabase.functions.invoke("manage-client-access", {
            body: {
              clientId: clientId,
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

        toast({ title: "Sucesso", description: "Cliente cadastrado com sucesso!" });
        navigate(`${basePath}/cliente/${clientId}`);
      }
    } catch (error: any) {
      console.error(error);
      toast({ title: "Erro ao salvar", description: getFriendlyError(error).description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}/clientes`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-thin tracking-tight">Novo Cliente</h1>
            <p className="text-sm text-muted-foreground">Preencha os dados para cadastrar um novo cliente na plataforma.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(`${basePath}/clientes`)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={isLoading} className="gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-primary/80 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Identificação da empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                <div className="space-y-2">
                  <Label>CNPJ *</Label>
                  <Input
                    value={form.cnpj}
                    onChange={e => { setCnpjMessage(null); set('cnpj', maskCnpj(e.target.value)); }}
                    onPaste={e => {
                      e.preventDefault();
                      const txt = e.clipboardData.getData('text');
                      setCnpjMessage(null);
                      set('cnpj', maskCnpj(txt));
                    }}
                    placeholder="00.000.000/0000-00"
                    inputMode="numeric"
                  />
                </div>
                <Button type="button" onClick={handleBuscarCnpj} disabled={cnpjLoading} className="gap-2">
                  {cnpjLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {cnpjLoading ? 'Buscando...' : 'Buscar dados'}
                </Button>
              </div>
              {cnpjMessage && (
                <p className={`text-xs ${cnpjMessage.type === 'success' ? 'text-emerald-600' : cnpjMessage.type === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {cnpjMessage.text}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Dados Básicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Razão Social *</Label>
                <Input value={form.razaoSocial} onChange={e => set('razaoSocial', e.target.value)} placeholder="Razão social completa" />
              </div>
              <div className="space-y-2">
                <Label>Nome Fantasia *</Label>
                <Input value={form.nomeFantasia} onChange={e => set('nomeFantasia', e.target.value)} placeholder="Nome fantasia" />
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>E-mail Institucional</Label>
                  <Input value={form.institutional_email} onChange={e => set('institutional_email', e.target.value)} placeholder="Ex: contato@empresa.com" />
                </div>
                <div className="space-y-2">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-primary/80 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input value={form.cep} onChange={e => set('cep', e.target.value)} placeholder="00000-000" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Logradouro</Label>
                  <Input value={form.street} onChange={e => set('street', e.target.value)} placeholder="Rua, Av, etc" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input value={form.number} onChange={e => set('number', e.target.value)} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Complemento</Label>
                  <Input value={form.complement} onChange={e => set('complement', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} />
                </div>
                <div className="space-y-2">
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
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Gestão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Responsável no Cliente (Nome)</Label>
                <Input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Nome do contato" />
              </div>
              <div className="space-y-2">
                <Label>Telefone do Responsável</Label>
                <Input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label>Responsável *</Label>
                <Select 
                  value={form.consultorId} 
                  onValueChange={v => set('consultorId', v)}
                  disabled={!isAdmin}
                >
                  <SelectTrigger><SelectValue placeholder={loadingConsultores ? "Carregando..." : "Selecione..."} /></SelectTrigger>
                  <SelectContent>
                    {consultores && consultores.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold text-primary/80 uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-4 w-4" /> Portal
              </CardTitle>
              <Switch checked={form.liberarPortal} onCheckedChange={v => set('liberarPortal', v)} />
            </CardHeader>
            <CardContent className="space-y-4">
              {form.liberarPortal && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label>E-mail de Login</Label>
                    <Input type="email" value={form.emailPortal} onChange={e => set('emailPortal', e.target.value)} placeholder="email@cliente.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha Temporária</Label>
                    <Input type="password" value={form.senhaPortal} onChange={e => set('senhaPortal', e.target.value)} placeholder="••••••••" />
                  </div>
                </div>
              )}
              {!form.liberarPortal && (
                <p className="text-xs text-muted-foreground italic">Acesso ao portal desabilitado.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-primary/80 uppercase tracking-wider flex items-center gap-2">
            <Target className="h-4 w-4" /> Alinhamento Estratégico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Objetivo atual</Label>
                <span className="text-[10px] text-muted-foreground">{form.current_objective.length}/{OBJETIVO_MAX}</span>
              </div>
              <Textarea
                value={form.current_objective}
                onChange={e => set('current_objective', e.target.value.slice(0, OBJETIVO_MAX))}
                placeholder="Qual o objetivo principal do cliente neste momento?"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Briefing / Observações</Label>
                <span className="text-[10px] text-muted-foreground">{form.briefing.length}/{BRIEFING_MAX}</span>
              </div>
              <Textarea
                value={form.briefing}
                onChange={e => set('briefing', e.target.value.slice(0, BRIEFING_MAX))}
                placeholder="Notas adicionais sobre o cliente..."
                rows={4}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Dores e problemas <span className="text-[10px] text-muted-foreground font-normal">({pains.length}/{LIST_MAX_ITEMS})</span></Label>
              <div className="flex gap-2">
                <Input
                  value={newPain}
                  onChange={e => setNewPain(e.target.value.slice(0, ITEM_MAX_CHARS))}
                  placeholder="Adicionar dor ou problema"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(pains, setPains, newPain, () => setNewPain(''), 'dores e problemas'); } }}
                />
                <Button type="button" variant="outline" size="icon" onClick={() => addItem(pains, setPains, newPain, () => setNewPain(''), 'dores e problemas')}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {pains.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhuma dor cadastrada.</p>
              ) : (
                <ul className="space-y-1.5">
                  {pains.map((p, i) => (
                    <li key={i} className="flex items-start justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                      <span className="break-words flex-1">{p}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setPains(pains.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <Label>Fatores de sucesso <span className="text-[10px] text-muted-foreground font-normal">({successFactors.length}/{LIST_MAX_ITEMS})</span></Label>
              <div className="flex gap-2">
                <Input
                  value={newFactor}
                  onChange={e => setNewFactor(e.target.value.slice(0, ITEM_MAX_CHARS))}
                  placeholder="Adicionar fator de sucesso"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(successFactors, setSuccessFactors, newFactor, () => setNewFactor(''), 'fatores de sucesso'); } }}
                />
                <Button type="button" variant="outline" size="icon" onClick={() => addItem(successFactors, setSuccessFactors, newFactor, () => setNewFactor(''), 'fatores de sucesso')}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {successFactors.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum fator de sucesso cadastrado.</p>
              ) : (
                <ul className="space-y-1.5">
                  {successFactors.map((f, i) => (
                    <li key={i} className="flex items-start justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                      <span className="break-words flex-1">{f}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setSuccessFactors(successFactors.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOverwriteOpen} onOpenChange={setConfirmOverwriteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir dados existentes?</AlertDialogTitle>
            <AlertDialogDescription>
              Alguns campos já foram preenchidos. Deseja substituir pelas informações encontradas no CNPJ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              if (pendingLookup) applyLookup(pendingLookup, false);
              setPendingLookup(null);
              setCnpjMessage({ type: 'success', text: 'Campos vazios foram preenchidos. Dados existentes foram mantidos.' });
            }}>Manter dados atuais</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingLookup) applyLookup(pendingLookup, true);
              setPendingLookup(null);
              setCnpjMessage({ type: 'success', text: 'Dados encontrados e preenchidos automaticamente.' });
            }}>Substituir dados</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
