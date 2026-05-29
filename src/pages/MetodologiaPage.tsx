import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPermissions } from '@/hooks/useConsultantPermissions';
import { PageHeader } from '@/components/PageHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatusTag, StatusVariant } from '@/components/StatusTag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BookOpen, FileText, Video, FileSpreadsheet, Presentation, Link2, Download,
  Search, Compass, AlertTriangle, Layers, Loader2,
  Plus, Pencil, Trash2, LayoutGrid, MessageSquare, ClipboardList, Flag, HelpCircle, Lightbulb
} from 'lucide-react';
import { labelTipoMaterial, labelCategoria } from '@/data/metodologia';
import { toast } from '@/hooks/use-toast';
import { useMethodologyCRUD } from '@/hooks/useMethodologyCRUD';
import { ModalMethodologyNote } from '@/components/modals/ModalMethodologyNote';
import { MethodologyNote } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { PhaseForm } from '@/components/methodology/PhaseForm';
import { MaterialForm } from '@/components/methodology/MaterialForm';
import { Badge } from '@/components/ui/badge';
import { TransversalMaterialForm } from '@/components/methodology/TransversalMaterialForm';

const ICONE_TIPO: Record<string, typeof FileText> = {
  pdf: FileText,
  video: Video,
  planilha: FileSpreadsheet,
  apresentacao: Presentation,
  link: Link2,
  template: Layers,
  material: FileText,
};

const FASE_COR: Record<number, string> = {
  0: 'border-l-blue-500',
  1: 'border-l-violet-500',
  2: 'border-l-amber-500',
  3: 'border-l-emerald-500',
  4: 'border-l-slate-500',
};

function MaterialItem({ m, isAdmin, onDelete, onEdit }: { m: any, isAdmin: boolean, onDelete?: (id: string) => void, onEdit?: (m: any) => void }) {
  const Icon = ICONE_TIPO[m.type] || FileText;
  return (
    <div className="w-full flex items-center gap-3 p-3 rounded-md border bg-background hover:-translate-y-0.5 hover:shadow-md transition-all text-left group">
      <Icon className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium truncate">{m.title}</p>
          {m.is_essential && (
            <StatusTag label="Essencial" variant="info" />
          )}
          {m.is_updated && (
            <StatusTag label="Atualizado" variant="warning" />
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{m.description}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isAdmin && (
          <>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit?.(m)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete?.(m.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <a href={m.file_url || m.url} target="_blank" rel="noopener noreferrer">
            <Download className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export default function MetodologiaPage() {
  const { perfil } = useAuth();
  const { can, isLoading: loadingPermissions } = useMyPermissions();
  const { phases, transversalMaterials, isLoading: loadingMethodology, deleteMaterial } = useMethodologyCRUD();
  const queryClient = useQueryClient();

  const [busca, setBusca] = useState('');
  const [faseAtivaId, setFaseAtivaId] = useState<string | null>(null);
  
  const [phaseModalOpen, setPhaseModalOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<any>(null);

  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  const [transversalModalOpen, setTransversalModalOpen] = useState(false);
  const [selectedTransversal, setSelectedTransversal] = useState<any>(null);

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<MethodologyNote | null>(null);

  const isAdmin = perfil === 'admin';
  const loading = loadingPermissions || loadingMethodology;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const activePhase = phases?.find(p => p.id === (faseAtivaId || phases[0]?.id)) || phases?.[0];

  const handleEditPhase = (p: any) => {
    setSelectedPhase(p);
    setPhaseModalOpen(true);
  };

  const handleAddMaterial = () => {
    setSelectedMaterial(null);
    setMaterialModalOpen(true);
  };

  const handleEditMaterial = (m: any) => {
    setSelectedMaterial(m);
    setMaterialModalOpen(true);
  };

  const handleAddTransversal = () => {
    setSelectedTransversal(null);
    setTransversalModalOpen(true);
  };

  const handleEditTransversal = (m: any) => {
    setSelectedTransversal(m);
    setTransversalModalOpen(true);
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Excluir material?')) return;
    try {
      await deleteMaterial(id);
      toast({ title: 'Sucesso', description: 'Material removido.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    }
  };

  const handleDeleteTransversal = async (id: string) => {
    if (!confirm('Excluir material transversal?')) return;
    try {
      const { error } = await supabase.from('methodology_transversal_materials').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['methodology-transversal'] });
      toast({ title: 'Sucesso', description: 'Material removido.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    }
  };

  const handleDeletePhase = async (id: string) => {
    if (!confirm('Excluir fase e todos os seus itens?')) return;
    try {
      const { error } = await supabase.from('methodology_phases').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['methodology-phases-crud'] });
      toast({ title: 'Sucesso', description: 'Fase removida.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    }
  };

  if (perfil === 'consultor' && !can('metodologia')) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Você não tem permissão para acessar este módulo.</p>
      </div>
    );
  }

  const filtraMaterial = (m: any) => !busca.trim() || m.title.toLowerCase().includes(busca.toLowerCase()) || m.description?.toLowerCase().includes(busca.toLowerCase());
  const activeMaterials = activePhase?.materials?.filter(filtraMaterial) || [];

  return (
    <div className="space-y-10">
      <PageHeader
        titulo="Metodologia Seven"
        subtitulo="Hub central de conhecimento, materiais, templates e perguntas-chave da consultoria."
      >
        {isAdmin && (
          <Button onClick={() => setNoteModalOpen(true)} className="gap-2 bg-seven-warning hover:bg-seven-warning/90 text-black font-bold">
            <Plus className="h-4 w-4" />
            Novo Registro Metodológico
          </Button>
        )}
      </PageHeader>

      <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Compass className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-editorial text-2xl">A jornada Seven</h2>
                {isAdmin && (
                  <Button size="sm" onClick={() => { setSelectedPhase(null); setPhaseModalOpen(true); }} className="gap-2">
                    <Plus className="h-4 w-4" /> Nova Fase
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cada fase tem propósito claro, entregáveis padronizados e materiais de apoio para o consultor entregar excelência.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {phases?.map((f, i) => (
                  <button
                    key={f.id}
                    onClick={() => setFaseAtivaId(f.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                      (faseAtivaId === f.id || (!faseAtivaId && i === 0)) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'
                    }`}
                  >
                    {f.order_index}. {f.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {activePhase ? (
        <Card className={`border-l-4 ${FASE_COR[activePhase.order_index % 5]}`}>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
              <div>
                <p className="ui-overline mb-1">Fase {activePhase.order_index}</p>
                <div className="flex items-center gap-3">
                  <h2 className="font-editorial text-3xl">{activePhase.name}</h2>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditPhase(activePhase)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeletePhase(activePhase.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{activePhase.subtitle || activePhase.purpose}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="ui-overline">Duração média</p>
                <p className="text-sm font-medium">{activePhase.average_duration || 'A definir'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="ui-overline">Objetivos</p>
                <ul className="space-y-1.5">
                  {activePhase.objectives?.map((o: any) => (
                    <li key={o.id} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-0.5">→</span><span>{o.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <p className="ui-overline">Entregáveis padrão</p>
                <ul className="space-y-1.5">
                  {activePhase.deliverables?.map((e: any) => (
                    <li key={e.id} className="text-sm flex items-start gap-2">
                      <span className="text-seven-success mt-0.5">✓</span><span>{e.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <p className="ui-overline">Ferramentas</p>
                <div className="flex flex-wrap gap-1.5">
                  {activePhase.tools?.map((f: any) => (
                    <span key={f.id} className="text-xs px-2 py-1 rounded-md bg-muted border">{f.name}</span>
                  ))}
                </div>
              </div>
            </div>

            <Tabs defaultValue="materiais" className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="materiais"><BookOpen className="h-3.5 w-3.5 mr-1.5" /> Materiais</TabsTrigger>
                  <TabsTrigger value="templates"><Layers className="h-3.5 w-3.5 mr-1.5" /> Templates</TabsTrigger>
                </TabsList>
                {isAdmin && (
                  <Button size="sm" variant="outline" onClick={handleAddMaterial} className="gap-2">
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </Button>
                )}
              </div>

              <TabsContent value="materiais">
                <div className="relative mb-3">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    placeholder="Buscar material..."
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  {activeMaterials.filter((m: any) => m.category === 'material' || !m.category).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Nenhum material encontrado.</p>
                  ) : activeMaterials.filter((m: any) => m.category === 'material' || !m.category).map((m: any) => (
                    <MaterialItem key={m.id} m={m} isAdmin={isAdmin} onDelete={handleDeleteMaterial} onEdit={handleEditMaterial} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="templates" className="space-y-2">
                {activeMaterials.filter((m: any) => m.category === 'template').length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum template encontrado.</p>
                ) : activeMaterials.filter((m: any) => m.category === 'template').map((m: any) => (
                  <MaterialItem key={m.id} m={m} isAdmin={isAdmin} onDelete={handleDeleteMaterial} onEdit={handleEditMaterial} />
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-10 border-2 border-dashed rounded-xl">
          <LayoutGrid className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma fase cadastrada.</p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            overline="Biblioteca geral"
            titulo="Materiais transversais Seven"
          />
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={handleAddTransversal} className="gap-2">
                <Plus className="h-4 w-4" /> Adicionar Material Geral
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {transversalMaterials?.map(g => (
            <div key={g.id} className="p-4 rounded-md border bg-background space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {g.category}
                  </span>
                </div>
                {g.status === 'coming_soon' && <StatusTag label="Em breve" variant="neutral" />}
              </div>
              <p className="text-sm font-medium">{g.title}</p>
              <p className="text-xs text-muted-foreground leading-snug">{g.description}</p>
              <div className="flex items-center justify-between pt-2">
                 <p className="text-[10px] text-muted-foreground">Atualizado em {new Date(g.updated_at).toLocaleDateString()}</p>
                 <div className="flex items-center gap-1">
                   {isAdmin && (
                     <>
                       <Button variant="ghost" size="sm" className="h-7 w-7" onClick={() => handleEditTransversal(g)}>
                         <Pencil className="h-3.5 w-3.5" />
                       </Button>
                       <Button variant="ghost" size="sm" className="h-7 w-7 text-destructive" onClick={() => handleDeleteTransversal(g.id)}>
                         <Trash2 className="h-3.5 w-3.5" />
                       </Button>
                     </>
                   )}
                   <Button variant="ghost" size="sm" className="h-7 w-7" asChild>
                      <a href={g.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-3.5 w-3.5" /></a>
                   </Button>
                 </div>
              </div>
            </div>
          ))}
          {transversalMaterials?.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2 text-center py-10 border border-dashed rounded-md">
              Nenhum material transversal encontrado.
            </p>
          )}
        </div>
      </div>

      <PhaseForm 
        open={phaseModalOpen} 
        onOpenChange={setPhaseModalOpen} 
        phase={selectedPhase} 
      />
      
      <MaterialForm 
        open={materialModalOpen} 
        onOpenChange={setMaterialModalOpen} 
        phaseId={activePhase?.id} 
        material={selectedMaterial} 
      />

      <TransversalMaterialForm
        open={transversalModalOpen}
        onOpenChange={setTransversalModalOpen}
        material={selectedTransversal}
      />
      
      <ModalMethodologyNote
        open={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        note={selectedNote}
        phases={phases}
      />
    </div>
  );
}
