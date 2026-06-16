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
import { Loader2, Shield, MapPin, ArrowLeft, Save, X, Plus, Trash2, Target } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

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

  useEffect(() => {
    if (!isAdmin && user?.id) {
      setForm(prev => ({ ...prev, consultorId: user.id }));
    }
  }, [isAdmin, user]);

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

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
              <CardTitle className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Dados Básicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Razão Social *</Label>
                <Input value={form.razaoSocial} onChange={e => set('razaoSocial', e.target.value)} placeholder="Razão social completa" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Fantasia *</Label>
                  <Input value={form.nomeFantasia} onChange={e => set('nomeFantasia', e.target.value)} placeholder="Nome fantasia" />
                </div>
                <div className="space-y-2">
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
    </div>
  );
}
