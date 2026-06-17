import { getFriendlyError } from '@/lib/friendlyErrors';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  Save, X, Pencil, ArrowLeft, Briefcase, FileText, 
  MapPin, Users, Calendar, DollarSign, Loader2, PlusCircle, MinusCircle,
  Clock, CheckCircle2, Circle, Camera, Trash2, Upload
} from 'lucide-react';
import { formatDuration } from '@/lib/duration';
import { useParams, useNavigate } from 'react-router-dom';
import { useClienteFicha } from '@/hooks/useClienteFicha';
import { useClienteContratos } from '@/hooks/useClienteContratos';
import { useConsultores } from '@/hooks/useConsultores';
import { supabase } from '@/integrations/supabase/client';
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
import { calcularPorteClinica } from '@/data/clienteExtras';
import { TarefasClienteSection } from '@/components/TarefasClienteSection';
import { ModalTarefa } from '@/components/modals/ModalTarefa';
import { OneDriveLinksCard } from '@/components/cliente/OneDriveLinksCard';

// --- Sub-componentes movidos para ContractJourneyCard ---

// Sub-componentes removidos daqui e movidos para src/components/contracts/ContractJourneyCard.tsx

// --- Componente Principal ---

export default function ClienteDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { perfil, user } = useAuth();
  const isAdmin = perfil === 'admin';
  const { can, isLoading: loadingPermissions } = useMyPermissions();
  const { toast } = useToast();
  
  const { cliente, isLoading: loadingClientes, updateCliente } = useClienteFicha(id);
  const { contratos: contratosCliente = [], isLoading: loadingContratos } = useClienteContratos(id);
  const { consultores, isLoading: loadingConsultores } = useConsultores();

  const [isEditing, setIsEditing] = useState(false);
  const [fichaForm, setFichaForm] = useState<any>(null);
  const [fichaPains, setFichaPains] = useState<string[]>([]);
  const [fichaSuccessFactors, setFichaSuccessFactors] = useState<string[]>([]);
  const [fichaNewPain, setFichaNewPain] = useState('');
  const [fichaNewSuccessFactor, setFichaNewSuccessFactor] = useState('');
  const [isUploadingAvatar, setIsSubmittingAvatar] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openNewTask = () => setTaskModalOpen(true);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 2MB.",
        variant: "destructive"
      });
      return;
    }

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Use JPG, PNG ou WEBP.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `${id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('client-avatars')
        .getPublicUrl(filePath);

      // Remove old avatar if exists
      if (cliente?.avatar_path) {
        await supabase.storage
          .from('client-avatars')
          .remove([cliente.avatar_path]);
      }

      await updateCliente.mutateAsync({
        avatar_url: publicUrl,
        avatar_path: filePath
      });

      toast({
        title: "Sucesso",
        description: "Imagem de perfil atualizada com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: getFriendlyError(error).description || "Não foi possível enviar a imagem.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!id || !cliente?.avatar_path) return;

    try {
      await supabase.storage
        .from('client-avatars')
        .remove([cliente.avatar_path]);

      await updateCliente.mutateAsync({
        avatar_url: '',
        avatar_path: ''
      });

      toast({
        title: "Sucesso",
        description: "Imagem removida com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover",
        description: getFriendlyError(error).description || "Não foi possível remover a imagem.",
        variant: "destructive"
      });
    }
  };


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
      const fatNum = fichaForm.faturamentoMensal === '' || fichaForm.faturamentoMensal == null
        ? null
        : Number(fichaForm.faturamentoMensal);
      if (fatNum !== null && (isNaN(fatNum) || fatNum < 0)) {
        toast({ title: 'Faturamento inválido', description: 'O faturamento não pode ser negativo.', variant: 'destructive' });
        return;
      }
      const porteCalc = calcularPorteClinica(fatNum) || fichaForm.porte || null;
      await updateCliente.mutateAsync({
        ...fichaForm,
        faturamentoMensal: fatNum ?? 0,
        porte: porteCalc,
        pains: fichaPains,
        success_factors: fichaSuccessFactors,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving ficha:", err);
    }
  };

  const PAIN_MAX_ITEMS = 5;
  const PAIN_MAX_CHARS = 80;
  const FACTOR_MAX_ITEMS = 5;
  const FACTOR_MAX_CHARS = 80;
  const OBJETIVO_MAX = 300;
  const BRIEFING_MAX = 500;

  const addPain = () => {
    const v = fichaNewPain.trim();
    if (!v) return;
    if (fichaPains.length >= PAIN_MAX_ITEMS) {
      toast({ title: 'Limite atingido', description: `Máximo de ${PAIN_MAX_ITEMS} dores, com até ${PAIN_MAX_CHARS} caracteres cada.`, variant: 'destructive' });
      return;
    }
    if (v.length > PAIN_MAX_CHARS) {
      toast({ title: 'Texto muito longo', description: `Cada dor pode ter no máximo ${PAIN_MAX_CHARS} caracteres.`, variant: 'destructive' });
      return;
    }
    if (fichaPains.includes(v)) return;
    setFichaPains([...fichaPains, v]);
    setFichaNewPain('');
  };

  const removePain = (p: string) => setFichaPains(fichaPains.filter(item => item !== p));

  const addSuccessFactor = () => {
    const v = fichaNewSuccessFactor.trim();
    if (!v) return;
    if (fichaSuccessFactors.length >= FACTOR_MAX_ITEMS) {
      toast({ title: 'Limite atingido', description: `Máximo de ${FACTOR_MAX_ITEMS} fatores, com até ${FACTOR_MAX_CHARS} caracteres cada.`, variant: 'destructive' });
      return;
    }
    if (v.length > FACTOR_MAX_CHARS) {
      toast({ title: 'Texto muito longo', description: `Cada fator pode ter no máximo ${FACTOR_MAX_CHARS} caracteres.`, variant: 'destructive' });
      return;
    }
    if (fichaSuccessFactors.includes(v)) return;
    setFichaSuccessFactors([...fichaSuccessFactors, v]);
    setFichaNewSuccessFactor('');
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
              <div className="h-20 w-20 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white text-3xl font-black overflow-hidden border-2 border-white">
                {cliente.avatar_url ? (
                  <img src={cliente.avatar_url} alt={cliente.nomeFantasia} className="h-full w-full object-cover" />
                ) : (
                  cliente.nomeFantasia.charAt(0).toUpperCase()
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              
              {(isAdmin || can('ficha_cliente', 'edit')) && (
                <div className="absolute -bottom-2 -right-2 flex gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 rounded-full shadow-md hover:scale-105 transition-transform"
                    onClick={() => fileInputRef.current?.click()}
                    title="Alterar imagem"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  {cliente.avatar_url && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 rounded-full shadow-md hover:scale-105 transition-transform"
                      onClick={handleRemoveAvatar}
                      title="Remover imagem"
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
                  {calcularPorteClinica(cliente.faturamentoMensal) || cliente.porte || 'Porte não calculado'}
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
              <>
                <Button size="lg" variant="outline" onClick={openNewTask} className="h-11 px-5 font-bold">
                  <PlusCircle className="h-4 w-4 mr-2" /> Nova Tarefa
                </Button>
                {(isAdmin || can('ficha_cliente', 'edit')) && (
                  <Button size="lg" onClick={handleToggleEdit} className="h-11 px-6 font-bold shadow-lg shadow-primary/20">
                    <Pencil className="h-4 w-4 mr-2" /> Editar Ficha
                  </Button>
                )}
              </>
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
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Faturamento médio atual (R$)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        value={fichaForm?.faturamentoMensal ?? ''}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === '' || Number(v) >= 0) setF('faturamentoMensal', v);
                        }}
                        disabled={!isEditing}
                        placeholder="Ex: 50000"
                        className="bg-white font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Porte da clínica</Label>
                      <Input
                        value={calcularPorteClinica(fichaForm?.faturamentoMensal) || fichaForm?.porte || 'Não calculado'}
                        readOnly
                        disabled
                        className="bg-muted/40 font-medium"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Calculado automaticamente pelo faturamento médio atual.
                      </p>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Status Geral</Label>
                      <Select value={fichaForm?.status} onValueChange={v => setF('status', v)} disabled={!isEditing}>
                        <SelectTrigger className="bg-white font-medium">
                          <SelectValue placeholder="Selecione o status..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="pausado">Pausado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                          <SelectItem value="churn">Churn</SelectItem>
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
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Objetivo Atual</Label>
                        {isEditing && (
                          <span className="text-[10px] text-muted-foreground">{(fichaForm?.current_objective || '').length}/{OBJETIVO_MAX}</span>
                        )}
                      </div>
                      <Textarea
                        value={fichaForm?.current_objective}
                        onChange={e => setF('current_objective', e.target.value.slice(0, OBJETIVO_MAX))}
                        disabled={!isEditing}
                        maxLength={OBJETIVO_MAX}
                        placeholder={!isEditing && !fichaForm?.current_objective ? 'Não informado' : ''}
                        className="bg-white font-medium min-h-[80px]"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Dores e Problemas</Label>
                      {isEditing && (
                        <div className="space-y-1">
                          <div className="flex gap-2">
                            <Input
                              value={fichaNewPain}
                              onChange={e => setFichaNewPain(e.target.value.slice(0, PAIN_MAX_CHARS))}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPain(); } }}
                              placeholder="Nova dor..."
                              maxLength={PAIN_MAX_CHARS}
                              className="h-8 text-xs"
                            />
                            <Button size="sm" onClick={addPain} type="button" className="h-8" disabled={fichaPains.length >= PAIN_MAX_ITEMS}><PlusCircle className="h-4 w-4" /></Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{fichaPains.length}/{PAIN_MAX_ITEMS} itens · {fichaNewPain.length}/{PAIN_MAX_CHARS} caracteres</p>
                        </div>
                      )}
                      <div className="min-h-[40px] p-3 rounded-lg bg-muted/20 border border-dashed">
                        {fichaPains.length > 0 ? (
                          <ul className="space-y-1.5">
                            {fichaPains.map(p => (
                              <li key={p} className="flex items-start gap-2 text-sm">
                                <span className="text-primary mt-1.5 leading-none">•</span>
                                <span className="flex-1 break-words">{p}</span>
                                {isEditing && (
                                  <MinusCircle className="h-3.5 w-3.5 text-destructive cursor-pointer hover:scale-110 transition-transform shrink-0 mt-1" onClick={() => removePain(p)} />
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : <span className="text-[11px] text-muted-foreground italic">Nenhuma dor cadastrada</span>}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Fatores de Sucesso</Label>
                      {isEditing && (
                        <div className="space-y-1">
                          <div className="flex gap-2">
                            <Input
                              value={fichaNewSuccessFactor}
                              onChange={e => setFichaNewSuccessFactor(e.target.value.slice(0, FACTOR_MAX_CHARS))}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSuccessFactor(); } }}
                              placeholder="Novo fator..."
                              maxLength={FACTOR_MAX_CHARS}
                              className="h-8 text-xs"
                            />
                            <Button size="sm" onClick={addSuccessFactor} type="button" className="h-8" disabled={fichaSuccessFactors.length >= FACTOR_MAX_ITEMS}><PlusCircle className="h-4 w-4" /></Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{fichaSuccessFactors.length}/{FACTOR_MAX_ITEMS} itens · {fichaNewSuccessFactor.length}/{FACTOR_MAX_CHARS} caracteres</p>
                        </div>
                      )}
                      <div className="min-h-[40px] p-3 rounded-lg bg-muted/20 border border-dashed">
                        {fichaSuccessFactors.length > 0 ? (
                          <ul className="space-y-1.5">
                            {fichaSuccessFactors.map(s => (
                              <li key={s} className="flex items-start gap-2 text-sm">
                                <span className="text-primary mt-1.5 leading-none">•</span>
                                <span className="flex-1 break-words">{s}</span>
                                {isEditing && (
                                  <MinusCircle className="h-3.5 w-3.5 text-destructive cursor-pointer hover:scale-110 transition-transform shrink-0 mt-1" onClick={() => removeSuccessFactor(s)} />
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : <span className="text-[11px] text-muted-foreground italic">Nenhum fator cadastrado</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-5 pb-2 border-b">
                    <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Briefing / Observações</h4>
                    {isEditing && (
                      <span className="text-[10px] text-muted-foreground">{(fichaForm?.briefing || '').length}/{BRIEFING_MAX}</span>
                    )}
                  </div>
                  <Textarea
                    value={fichaForm?.briefing}
                    onChange={e => setF('briefing', e.target.value.slice(0, BRIEFING_MAX))}
                    disabled={!isEditing}
                    maxLength={BRIEFING_MAX}
                    className="bg-white font-medium min-h-[120px]"
                    placeholder={!isEditing && !fichaForm?.briefing ? 'Não informado' : 'Notas adicionais sobre o cliente...'}
                  />

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
          <Accordion
            type="multiple"
            defaultValue={contratosCliente.map(c => c.id)}
            className="w-full space-y-4"
          >
            {contratosCliente.map(contrato => (
              <ContractJourneyCard 
                key={contrato.id} 
                contrato={contrato} 
                mode={isAdmin ? 'admin' : 'consultor'} 
              />
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

      {/* --- Seção 3: Tarefas do Cliente --- */}
      {id && <TarefasClienteSection clientId={id} onCreateTask={openNewTask} />}

      {/* --- Seção: OneDrive do Cliente --- */}
      {id && <OneDriveLinksCard clientId={id} />}

      <ModalTarefa
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        defaultContext={{
          clienteId: id,
          consultorId: user?.id,
        }}
      />

    </div>
  );
}
