import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, Briefcase, Calendar, DollarSign, Users, 
  ExternalLink, Loader2, Package, ListChecks, CheckCircle2 
} from 'lucide-react';
import { useContratos } from '@/hooks/useContratos';
import { useContractProducts } from '@/hooks/useContractProducts';
import { ContractJourneyCard } from '@/components/contracts/ContractJourneyCard';
import { labelStatus } from '@/data/mockData';
import { StatusTag } from '@/components/StatusTag';
import { useMemo } from 'react';

export default function AdminContratoDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contratos, isLoading: loadingContratos } = useContratos();
  
  const contrato = useMemo(() => {
    return contratos?.find(c => c.id === id);
  }, [contratos, id]);

  const { products, isLoading: loadingProducts } = useContractProducts(id || '');

  const stats = useMemo(() => {
    if (!products) return { totalProducts: 0, totalModules: 0 };
    return {
      totalProducts: products.length,
      totalModules: 0 // Simplificado para evitar erro TS, dados reais vêm via subcomponentes
    };
  }, [products]);

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
                <h1 className="text-3xl font-black text-foreground tracking-tight">{contrato.tipo}</h1>
                <StatusTag label={labelStatus[contrato.status] || contrato.status} />
              </div>
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <span>Cliente:</span>
                <button 
                  onClick={() => navigate(`/admin/cliente/${contrato.clienteId}`)}
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {contrato.clienteNome}
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Future: Add Edit button that opens ModalContrato */}
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
              <p className="text-lg font-black tabular-nums">R$ {contrato.valor.toLocaleString('pt-BR')}</p>
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
              <p className="text-sm font-bold">
                {new Date(contrato.dataInicio).toLocaleDateString()} - {new Date(contrato.dataFim).toLocaleDateString()}
              </p>
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
              <p className="text-sm font-bold truncate max-w-[150px]">{contrato.consultorNome}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jornada do Contrato */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-black uppercase tracking-tight">Produtos e Jornada de Execução</h2>
        </div>
        
        <ContractJourneyCard contrato={contrato} expanded={true} />
      </section>
    </div>
  );
}
