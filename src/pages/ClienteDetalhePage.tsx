import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  Save, X, Pencil, ArrowLeft, Briefcase, FileText, 
  MapPin, Users, Calendar, DollarSign, Loader2, PlusCircle, MinusCircle,
  Clock, CheckCircle2, Circle, Camera, Upload, Trash2
} from 'lucide-react';
import { formatDuration } from '@/lib/duration';
import { useParams, useNavigate } from 'react-router-dom';
import { useClienteFicha } from '@/hooks/useClienteFicha';
import { useClienteContratos } from '@/hooks/useClienteContratos';
import { useConsultores } from '@/hooks/useConsultores';
import { labelStatus, labelRegiao } from '@/data/mockData';
import { StatusTag } from '@/components/StatusTag';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion } from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPermissions } from '@/hooks/useConsultantPermissions';
import { ContractJourneyCard } from '@/components/contracts/ContractJourneyCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// --- Sub-componentes movidos para ContractJourneyCard ---

// Sub-componentes removidos daqui e movidos para src/components/contracts/ContractJourneyCard.tsx

// --- Componente Principal ---

export default function ClienteDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { perfil, user } = useAuth();
  const { can, isLoading: loadingPermissions } = useMyPermissions();
  const { toast } = useToast();
  
  const { cliente, isLoading: loadingClientes, updateCliente } = useClienteFicha(id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { contratos: contratosCliente = [], isLoading: loadingContratos } = useClienteContratos(id);
  const { consultores, isLoading: loadingConsultores } = useConsultores();

  const [isEditing, setIsEditing] = useState(false);
  const [fichaForm, setFichaForm] = useState<any>(null);
  const [fichaPains, setFichaPains] = useState<string[]>([]);
  const [fichaSuccessFactors, setFichaSuccessFactors] = useState<string[]>([]);
  const [fichaNewPain, setFichaNewPain] = useState('');
  const [fichaNewSuccessFactor, setFichaNewSuccessFactor] = useState('');

  useEffect(() => {
    if (cliente) {
      setFichaForm({
        razaoSocial: cliente.razaoSocial || '',
        nomeFantasia: cliente.nomeFantasia || '',
        cnpj: cliente.cnpj || '',
        contact_name: cliente.contact_name || '',
        contact_phone: cliente.contact_phone || '',
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
      setFichaPains(cliente.pains || []);
      setFichaSuccessFactors(cliente.success_factors || []);
    }
  }, [cliente]);

  const handleToggleEdit = () => {
    if (isEditing) {
      // Re-carregar dados originais se cancelar
      if (cliente) {
        setFichaForm({
          razaoSocial: cliente.razaoSocial || '',
          nomeFantasia: cliente.nomeFantasia || '',
          cnpj: cliente.cnpj || '',
          contact_name: cliente.contact_name || '',
          contact_phone: cliente.contact_phone || '',
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
        setFichaPains(cliente.pains || []);
        setFichaSuccessFactors(cliente.success_factors || []);
      }
    }
    setIsEditing(!isEditing);
  };

  const handleSaveFicha = async () => {
    if (!fichaForm.razaoSocial.trim() || !fichaForm.nomeFantasia.trim()) {
      toast({ title: "Campos obrigatórios", description: "Razão Social e Nome Fantasia são obrigatórios.", variant: "destructive" });
      return;
    }
    
    try {
      await updateCliente.mutateAsync({
        ...fichaForm,
        pains: fichaPains,
        success_factors: fichaSuccessFactors,
      });
      setIsEditing(false);
      toast({ title: "Sucesso", description: "Ficha do cliente atualizada com sucesso." });
    } catch (err) {
      console.error("Error saving ficha:", err);
      toast({ title: "Erro ao salvar", description: "Ocorreu um erro ao salvar as alterações.", variant: "destructive" });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Arquivo inválido", description: "Por favor, selecione uma imagem.", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O tamanho máximo é 2MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('client-avatars')
        .getPublicUrl(filePath);

      await updateCliente.mutateAsync({ avatar_url: publicUrl } as any);
      toast({ title: "Sucesso", description: "Imagem de perfil atualizada." });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({ title: "Erro no upload", description: error.message || "Erro ao enviar imagem.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!id) return;
    try {
      await updateCliente.mutateAsync({ avatar_url: null } as any);
      toast({ title: "Sucesso", description: "Imagem de perfil removida." });
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      toast({ title: "Erro ao remover", description: "Não foi possível remover a imagem.", variant: "destructive" });
    }
  };

  const addPain = () => {
    if (fichaNewPain.trim() && !fichaPains.includes(fichaNewPain.trim())) {
      setFichaPains([...fichaPains, fichaNewPain.trim()]);
      setFichaNewPain('');
    }
  };

  const removePain = (p: string) => setFichaPains(fichaPains.filter(item => item !== p));

  const addSuccessFactor = () => {
    if (fichaNewSuccessFactor.trim() && !fichaSuccessFactors.includes(fichaNewSuccessFactor.trim())) {
      setFichaSuccessFactors([...fichaSuccessFactors, fichaNewSuccessFactor.trim()]);
      setFichaNewSuccessFactor('');
    }
  };

  const removeSuccessFactor = (s: string) => setFichaSuccessFactors(fichaSuccessFactors.filter(item => item !== s));

  const setF = (k: string, v: any) => setFichaForm((prev: any) => ({ ...prev, [k]: v }));

  const isLoadingGlobal = loadingPermissions || loadingClientes || loadingContratos || loadingConsultores;

  if (isLoadingGlobal) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse">Carregando dados do cliente...</p>
      </div>
    );
  }

  if (!cliente) return <div className="p-8 text-center bg-muted/20 rounded-xl m-8">Cliente não encontrado ou acesso negado.</div>;

  const isConsultor = perfil === 'consultor';
  const indicePadrao = isConsultor ? '/consultor/clientes' : '/admin/clientes';
  const indiceLabel = isConsultor ? 'Meus Clientes' : 'Clientes';
  const isAdmin = perfil === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10 animate-in fade-in duration-500">
      
      {/* --- Topo: Breadcrumb e Header --- */}
      <div className="space-y-6">
        <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
          <button onClick={() => navigate(indicePadrao)} className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            {indiceLabel}
          </button>
          <span className="opacity-40">/</span>
          <span className="text-foreground">{cliente.nomeFantasia}</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <Avatar className="h-24 w-24 rounded-2xl shadow-xl border-4 border-white">
                <AvatarImage src={cliente.avatar_url} className="object-cover" />
                <AvatarFallback className="bg-primary text-white text-3xl font-black rounded-none">
                  {cliente.nomeFantasia.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {(isAdmin || can('ficha_cliente', 'edit')) && (
                <div className="absolute -bottom-2 -right-2 flex gap-1">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleAvatarUpload} 
                    className="hidden" 
                    accept="image/*" 
                  />
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8 rounded-full shadow-md hover:bg-white transition-all"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </Button>
                  {cliente.avatar_url && (
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      className="h-8 w-8 rounded-full shadow-md"
                      onClick={handleRemoveAvatar}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-foreground tracking-tight">{cliente.nomeFantasia}</h1>
              <p className="text-muted-foreground font-medium">{cliente.razaoSocial}</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <StatusTag label={labelStatus[cliente.status] || cliente.status} />
                <Badge variant="outline" className="bg-white/50 border-muted/50 font-bold px-3 py-1 text-[10px] uppercase tracking-wider">
                  {cliente.porte}
                </Badge>
                <Badge variant="outline" className="bg-white/50 border-muted/50 font-bold px-3 py-1 text-[10px] uppercase tracking-wider">
                  {labelRegiao[cliente.regiao] || cliente.regiao}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Button variant="outline" size="lg" onClick={handleToggleEdit} className="h-11 px-6 font-bold shadow-sm">
                  <X className="h-4 w-4 mr-2" /> Cancelar
                </Button>
                <Button size="lg" onClick={handleSaveFicha} className="h-11 px-6 font-bold shadow-lg shadow-primary/20">
                  <Save className="h-4 w-4 mr-2" /> Salvar Alterações
                </Button>
              </>
            ) : (
              (isAdmin || can('ficha_cliente', 'edit')) && (
                <Button size="lg" onClick={handleToggleEdit} className="h-11 px-6 font-bold shadow-lg shadow-primary/20">
                  <Pencil className="h-4 w-4 mr-2" /> Editar Ficha
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* --- Seção 1: Ficha Cadastral (Sempre visível) --- */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-1.5 rounded-full bg-primary" />
          <h2 className="text-xl font-black uppercase tracking-tight">Ficha Cadastral</h2>
        </div>

        <Card className="shadow-xl border-muted/40 overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              
              {/* Coluna 1: Identificação e Contato */}
              <div className="space-y-8">
                <div>
                  <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-5 pb-2 border-b">Identificação</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Razão Social</Label>
                      <Input value={fichaForm?.razaoSocial} onChange={e => setF('razaoSocial', e.target.value)} disabled={!isEditing} className="bg-white font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Nome Fantasia</Label>
                      <Input value={fichaForm?.nomeFantasia} onChange={e => setF('nomeFantasia', e.target.value)} disabled={!isEditing} className="bg-white font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">CNPJ</Label>
                      <Input value={fichaForm?.cnpj} onChange={e => setF('cnpj', e.target.value)} disabled={!isEditing} className="bg-white font-medium" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-5 pb-2 border-b">Canais de Contato</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">E-mail Principal</Label>
                      <Input value={fichaForm?.email} onChange={e => setF('email', e.target.value)} disabled={!isEditing} className="bg-white font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">E-mail Institucional</Label>
                      <Input value={fichaForm?.institutional_email} onChange={e => setF('institutional_email', e.target.value)} disabled={!isEditing} className="bg-white font-medium" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Localização e Perfil */}
              <div className="space-y-8">
                <div>
                  <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-5 pb-2 border-b">Localização</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Logradouro</Label>
                      <Input value={fichaForm?.street} onChange={e => setF('street', e.target.value)} disabled={!isEditing} className="bg-white font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Número</Label>
                      <Input value={fichaForm?.number} onChange={e => setF('number', e.target.value)} disabled={!isEditing} className="bg-white font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Complemento</Label>
                      <Input value={fichaForm?.complement} onChange={e => setF('complement', e.target.value)} disabled={!isEditing} className="bg-white font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Bairro</Label>
                      <Input value={fichaForm?.neighborhood} onChange={e => setF('neighborhood', e.target.value)} disabled={!isEditing} className="bg-white font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">CEP</Label>
                      <Input value={fichaForm?.cep} onChange={e => setF('cep', e.target.value)} disabled={!isEditing} className="bg-white font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Região</Label>
                      <Select value={fichaForm?.regiao} onValueChange={v => setF('regiao', v)} disabled={!isEditing}>
                        <SelectTrigger className="bg-white font-medium">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sudeste">Sudeste</SelectItem>
                          <SelectItem value="sul">Sul</SelectItem>
                          <SelectItem value="centro_oeste">Centro-Oeste</SelectItem>
                          <SelectItem value="nordeste">Nordeste</SelectItem>
                          <SelectItem value="norte">Norte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-5 pb-2 border-b">Perfil Corporativo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Responsável no Cliente</Label>
                      <Input value={fichaForm?.contact_name} onChange={e => setF('contact_name', e.target.value)} disabled={!isEditing} className="bg-white font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Telefone Responsável</Label>
                      <Input value={fichaForm?.contact_phone} onChange={e => setF('contact_phone', e.target.value)} disabled={!isEditing} className="bg-white font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Porte</Label>
                      <Select value={fichaForm?.porte} onValueChange={v => setF('porte', v)} disabled={!isEditing}>
                        <SelectTrigger className="bg-white font-medium">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pequena">Pequena</SelectItem>
                          <SelectItem value="Média">Média</SelectItem>
                          <SelectItem value="Grande">Grande</SelectItem>
                          <SelectItem value="Multinacional">Multinacional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Status Geral</Label>
                      <Select value={fichaForm?.status} onValueChange={v => setF('status', v)} disabled={!isEditing}>
                        <SelectTrigger className="bg-white font-medium">
                          <SelectValue placeholder="Selecione o status..." />
                        </SelectTrigger>
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
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Responsável Interno</Label>
                      <Select value={fichaForm?.consultorId} onValueChange={v => setF('consultorId', v)} disabled={!isEditing}>
                        <SelectTrigger className="bg-white font-medium">
                          <SelectValue placeholder="Selecione o consultor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {consultores?.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna 3: Gestão e Alinhamento */}
              <div className="space-y-8">
                <div>
                  <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-5 pb-2 border-b">Alinhamento Estratégico</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Objetivo Atual</Label>
                      <Textarea value={fichaForm?.current_objective} onChange={e => setF('current_objective', e.target.value)} disabled={!isEditing} className="bg-white font-medium min-h-[80px]" />
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Dores e Problemas</Label>
                      {isEditing && (
                        <div className="flex gap-2">
                          <Input value={fichaNewPain} onChange={e => setFichaNewPain(e.target.value)} placeholder="Nova dor..." className="h-8 text-xs" />
                          <Button size="sm" onClick={addPain} type="button" className="h-8"><PlusCircle className="h-4 w-4" /></Button>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-lg bg-muted/20 border border-dashed">
                        {fichaPains.length > 0 ? fichaPains.map(p => (
                          <Badge key={p} variant="secondary" className="pr-1 gap-1 py-1 font-medium bg-white border">
                            {p}
                            {isEditing && <MinusCircle className="h-3 w-3 text-destructive cursor-pointer hover:scale-110 transition-transform" onClick={() => removePain(p)} />}
                          </Badge>
                        )) : <span className="text-[10px] text-muted-foreground italic self-center">Nenhuma dor registrada</span>}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Fatores de Sucesso</Label>
                      {isEditing && (
                        <div className="flex gap-2">
                          <Input value={fichaNewSuccessFactor} onChange={e => setFichaNewSuccessFactor(e.target.value)} placeholder="Novo fator..." className="h-8 text-xs" />
                          <Button size="sm" onClick={addSuccessFactor} type="button" className="h-8"><PlusCircle className="h-4 w-4" /></Button>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-lg bg-muted/20 border border-dashed">
                        {fichaSuccessFactors.length > 0 ? fichaSuccessFactors.map(s => (
                          <Badge key={s} variant="secondary" className="pr-1 gap-1 py-1 font-medium bg-white border">
                            {s}
                            {isEditing && <MinusCircle className="h-3 w-3 text-destructive cursor-pointer hover:scale-110 transition-transform" onClick={() => removeSuccessFactor(s)} />}
                          </Badge>
                        )) : <span className="text-[10px] text-muted-foreground italic self-center">Nenhum fator registrado</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-5 pb-2 border-b">Briefing / Observações</h4>
                  <Textarea value={fichaForm?.briefing} onChange={e => setF('briefing', e.target.value)} disabled={!isEditing} className="bg-white font-medium min-h-[120px]" placeholder="Notas adicionais sobre o cliente..." />
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </section>

      {/* --- Seção 2: Contratos e Jornada --- */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-1.5 rounded-full bg-seven-warning" />
          <h2 className="text-xl font-black uppercase tracking-tight">Contratos e Jornada</h2>
        </div>

        {loadingContratos ? (
          <div className="py-20 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary/40" />
            <p className="text-muted-foreground">Carregando contratos e produtos...</p>
          </div>
        ) : contratosCliente.length > 0 ? (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {contratosCliente.map(contrato => (
              <ContractJourneyCard key={contrato.id} contrato={contrato} />
            ))}
          </Accordion>
        ) : (
          <Card className="border-dashed shadow-none bg-muted/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-bold text-muted-foreground">Nenhum contrato ativo</h3>
              <p className="text-sm text-muted-foreground max-w-xs text-center mt-2">
                Este cliente ainda não possui contratos registrados ou todos os contratos foram encerrados.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

    </div>
  );
}
