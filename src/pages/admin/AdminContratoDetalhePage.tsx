import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, Briefcase, Calendar, DollarSign, Users, 
  ExternalLink, Loader2, Package, ListChecks, CheckCircle2,
  Pencil, Save, X, Plus
} from 'lucide-react';
import { useContratos } from '@/hooks/useContratos';
import { useContractProducts } from '@/hooks/useContractProducts';
import { ContractJourneyCard } from '@/components/contracts/ContractJourneyCard';
import { labelStatus, labelRisco } from '@/data/mockData';
import { StatusTag } from '@/components/StatusTag';
import { useMemo, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion } from '@/components/ui/accordion';
import { useClientes } from '@/hooks/useClientes';
import { useConsultores } from '@/hooks/useConsultores';
import { useToast } from '@/hooks/use-toast';
import { ModalContrato } from '@/components/modals/ModalContrato';

export default function AdminContratoDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { contratos, isLoading: loadingContratos, upsertContrato } = useContratos();
  const { clientes } = useClientes();
  const { consultores } = useConsultores();
  
  const { perfil, user } = useAuth();
  const isAdmin = perfil === 'admin';
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const contrato = useMemo(() => {
    return contratos?.find(c => c.id === id);
  }, [contratos, id]);

  useEffect(() => {
    if (contrato && !isEditing) {
      setFormData({
        tipo: contrato.tipo,
        status: contrato.status,
        valor: contrato.valor,
        dataInicio: contrato.dataInicio,
        dataFim: contrato.dataFim,
        consultorId: contrato.consultorId,
        risco: contrato.risco,
        clienteId: contrato.clienteId
      });
    }
  }, [contrato, isEditing]);

  const { products, isLoading: loadingProducts } = useContractProducts(id || '');

  const stats = useMemo(() => {
    if (!products) return { totalProducts: 0, totalModules: 0 };
    return {
      totalProducts: products.length,
      totalModules: 0
    };
  }, [products]);

  const handleSave = async () => {
    try {
      await upsertContrato.mutateAsync({
        id: contrato?.id,
        ...formData
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    }
  };

  if (loadingContratos) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse">Carregando dados do contrato...</p>
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="p-8 text-center bg-muted/20 rounded-xl m-8">
        Contrato não encontrado.
        <Button variant="link" onClick={() => navigate('/admin/contratos')}>Voltar para listagem</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-6">
        <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
          <button onClick={() => navigate('/admin/contratos')} className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            Contratos
          </button>
          <span className="opacity-40">/</span>
          <span className="text-foreground">Detalhe do Contrato</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white">
              <Briefcase className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <Input 
                    value={formData?.tipo} 
                    onChange={e => setFormData({...formData, tipo: e.target.value})}
                    className="text-2xl font-black h-10 w-[400px]"
                  />
                ) : (
                  <h1 className="text-3xl font-black text-foreground tracking-tight">{contrato.tipo}</h1>
                )}
                {isEditing ? (
                  <Select value={formData?.status} onValueChange={v => setFormData({...formData, status: v})}>
                    <SelectTrigger className="w-[180px] h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(labelStatus).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <StatusTag label={labelStatus[contrato.status] || contrato.status} />
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <span>Cliente:</span>
                {isEditing ? (
                  <Select value={formData?.clienteId} onValueChange={v => setFormData({...formData, clienteId: v})}>
                    <SelectTrigger className="w-[300px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes?.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nomeFantasia || c.razaoSocial}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <button 
                    onClick={() => navigate(`/admin/cliente/${contrato.clienteId}`)}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {contrato.clienteNome}
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2">
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
                <Pencil className="h-4 w-4" />
                Editar Contrato
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Resumo Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border-muted/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Valor Total</p>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">R$</span>
                  <Input 
                    type="number" 
                    value={formData?.valor} 
                    onChange={e => setFormData({...formData, valor: Number(e.target.value)})}
                    className="h-8 font-black tabular-nums"
                  />
                </div>
              ) : (
                <p className="text-lg font-black tabular-nums">R$ {contrato.valor.toLocaleString('pt-BR')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-muted/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vigência</p>
              {isEditing ? (
                <div className="flex flex-col gap-1">
                  <Input 
                    type="date" 
                    value={formData?.dataInicio} 
                    onChange={e => setFormData({...formData, dataInicio: e.target.value})}
                    className="h-7 text-[10px]"
                  />
                  <Input 
                    type="date" 
                    value={formData?.dataFim} 
                    onChange={e => setFormData({...formData, dataFim: e.target.value})}
                    className="h-7 text-[10px]"
                  />
                </div>
              ) : (
                <p className="text-sm font-bold">
                  {new Date(contrato.dataInicio).toLocaleDateString()} - {new Date(contrato.dataFim).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-muted/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Produtos</p>
              <p className="text-lg font-black">{stats.totalProducts}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-muted/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Responsável</p>
              {isEditing ? (
                <Select value={formData?.consultorId} onValueChange={v => setFormData({...formData, consultorId: v})}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {consultores?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-bold truncate max-w-[150px]">{contrato.consultorNome}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jornada do Contrato */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-primary" />
            <h2 className="text-lg font-black uppercase tracking-tight">Produtos e Jornada de Execução</h2>
          </div>
          <Button 
            onClick={() => setIsAddProductOpen(true)} 
            size="sm" 
            className="gap-2 shadow-sm font-bold"
          >
            <Plus className="h-4 w-4" />
            Adicionar Produto
          </Button>
        </div>
        
        <Accordion type="single" collapsible defaultValue={contrato.id} className="w-full">
          <ContractJourneyCard 
            contrato={contrato} 
            expanded={true} 
            isEditing={isEditing} 
            mode={isAdmin ? 'admin' : 'consultor'}
          />
        </Accordion>
      </section>

      {isAddProductOpen && (
        <ModalContrato 
          open={isAddProductOpen} 
          onClose={() => setIsAddProductOpen(false)} 
          contrato={contrato} 
        />
      )}

    </div>
  );
}
