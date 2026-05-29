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
  Search, Compass, AlertTriangle, ChevronRight, Layers, Library, Plug, Loader2,
  Plus, MessageSquare, ClipboardList, Flag, Lightbulb, HelpCircle, Pencil, Trash2
} from 'lucide-react';
import { METODOLOGIA, MATERIAIS_GERAIS, labelTipoMaterial, labelCategoria, type TipoMaterial, type Material } from '@/data/metodologia';
import { toast } from '@/hooks/use-toast';
import { useMethodology } from '@/hooks/useMethodology';
import { ModalMethodologyNote } from '@/components/modals/ModalMethodologyNote';
import { MethodologyNote } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { METODOLOGIA, MATERIAIS_GERAIS, labelTipoMaterial, labelCategoria, type TipoMaterial, type Material } from '@/data/metodologia';
import { toast } from '@/hooks/use-toast';

const ICONE_TIPO: Record<TipoMaterial, typeof FileText> = {
  pdf: FileText,
  video: Video,
  planilha: FileSpreadsheet,
  apresentacao: Presentation,
  link: Link2,
  template: Layers,
};

const FASE_COR: Record<string, string> = {
  diagnostico: 'border-l-blue-500',
  planejamento: 'border-l-violet-500',
  estruturacao: 'border-l-amber-500',
  monitoramento: 'border-l-emerald-500',
  encerramento: 'border-l-slate-500',
};

function MaterialItem({ m }: { m: Material }) {
  const Icon = ICONE_TIPO[m.tipo];
  return (
    <button
      type="button"
      onClick={() => toast({ title: m.titulo, description: 'Material disponível para download (mock).' })}
      className="w-full flex items-center gap-3 p-3 rounded-md border bg-background hover:-translate-y-0.5 hover:shadow-md transition-all text-left"
    >
      <Icon className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium truncate">{m.titulo}</p>
          {m.tag && (
            <StatusTag
              label={m.tag === 'novo' ? 'Novo' : m.tag === 'atualizado' ? 'Atualizado' : 'Essencial'}
              variant={m.tag === 'essencial' ? 'info' : m.tag === 'novo' ? 'success' : 'warning'}
            />
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{m.descricao}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {labelTipoMaterial[m.tipo]}
          {m.duracao && ` · ${m.duracao}`}
          {m.paginas && ` · ${m.paginas} páginas`}
          {' · atualizado em '}{m.atualizadoEm}
        </p>
      </div>
      <Download className="h-4 w-4 text-muted-foreground/60 shrink-0" strokeWidth={1.5} />
    </button>
  );
}

export default function MetodologiaPage() {
  const { perfil } = useAuth();
  const { can, isLoading: loadingPermissions } = useMyPermissions();
  const { phases, notes, isLoading: loadingMethodology } = useMethodology();
  const queryClient = useQueryClient();

  const [busca, setBusca] = useState('');
  const [faseAtiva, setFaseAtiva] = useState<string>(METODOLOGIA[0].id);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<MethodologyNote | null>(null);

  // Filtros para notes
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  const fase = METODOLOGIA.find(f => f.id === faseAtiva)!;

  const buscaNorm = busca.trim().toLowerCase();
  const filtra = (m: Material) => !buscaNorm || m.titulo.toLowerCase().includes(buscaNorm) || m.descricao.toLowerCase().includes(buscaNorm);
  const materiaisFiltrados = fase.materiais.filter(filtra);

  const isAdmin = perfil === 'admin';

  const notesFiltradas = (notes || []).filter(n => {
    if (filtroTipo !== 'todos' && n.type !== filtroTipo) return false;
    if (filtroStatus !== 'todos' && n.status !== filtroStatus) return false;
    return true;
  });

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta observação?')) return;
    try {
      const { error } = await supabase.from('methodology_notes').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['methodology-notes'] });
      toast({ title: 'Excluído', description: 'Registro metodológico removido.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: err.message });
    }
  };

  const isLoading = loadingPermissions || loadingMethodology;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (perfil === 'consultor' && !can('metodologia')) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Você não tem permissão para acessar este módulo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        titulo="Metodologia Seven"
        subtitulo="Hub central de conhecimento, materiais, templates e perguntas-chave da consultoria."
      />

      {/* Visão geral */}
      <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Compass className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="font-editorial text-2xl">A jornada Seven em 5 fases</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Diagnóstico → Planejamento → Estruturação → Monitoramento → Encerramento.
                Cada fase tem propósito claro, entregáveis padronizados e materiais de apoio para o consultor entregar excelência sem reinventar a roda.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {METODOLOGIA.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFaseAtiva(f.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                      faseAtiva === f.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'
                    }`}
                  >
                    {f.ordem}. {f.nome}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo da fase ativa */}
      <Card className={`border-l-4 ${FASE_COR[fase.id]}`}>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
            <div>
              <p className="ui-overline mb-1">Fase {fase.ordem} de {METODOLOGIA.length}</p>
              <h2 className="font-editorial text-3xl">{fase.nome}</h2>
              <p className="text-sm text-muted-foreground mt-1">{fase.proposito}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="ui-overline">Duração média</p>
              <p className="text-sm font-medium">{fase.duracaoMedia}</p>
            </div>
          </div>

          {/* Objetivos + Entregáveis + Ferramentas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="ui-overline">Objetivos</p>
              <ul className="space-y-1.5">
                {fase.objetivos.map((o, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-0.5">→</span><span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="ui-overline">Entregáveis padrão</p>
              <ul className="space-y-1.5">
                {fase.entregaveis.map((e, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-seven-success mt-0.5">✓</span><span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="ui-overline">Ferramentas</p>
              <div className="flex flex-wrap gap-1.5">
                {fase.ferramentas.map(f => (
                  <span key={f} className="text-xs px-2 py-1 rounded-md bg-muted border">{f}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Sub-tabs: materiais / templates / perguntas-chave / alertas */}
          <Tabs defaultValue="materiais" className="pt-2">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="materiais"><BookOpen className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} /> Materiais</TabsTrigger>
              <TabsTrigger value="templates"><Layers className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} /> Templates</TabsTrigger>
              <TabsTrigger value="perguntas">Perguntas-chave</TabsTrigger>
              <TabsTrigger value="alertas"><AlertTriangle className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} /> Alertas</TabsTrigger>
            </TabsList>

            <TabsContent value="materiais" className="mt-4">
              <div className="relative mb-3">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar material..."
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                {materiaisFiltrados.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum material encontrado.</p>
                ) : materiaisFiltrados.map(m => <MaterialItem key={m.id} m={m} />)}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="mt-4 space-y-2">
              {fase.templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => toast({ title: t.titulo, description: 'Template disponível para download.' })}
                  className="w-full flex items-start gap-3 p-3 rounded-md border bg-background hover:-translate-y-0.5 hover:shadow-md transition-all text-left"
                >
                  <Layers className="h-4 w-4 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{t.titulo}</p>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.formato}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.descricao}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {t.exemplos.map(ex => (
                        <span key={ex} className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{ex}</span>
                      ))}
                    </div>
                  </div>
                  <Download className="h-4 w-4 text-muted-foreground/60 shrink-0" strokeWidth={1.5} />
                </button>
              ))}
            </TabsContent>

            <TabsContent value="perguntas" className="mt-4 space-y-2">
              {fase.perguntasChave.map(p => (
                <div key={p.id} className="p-3 rounded-md border bg-background">
                  <p className="text-sm font-editorial text-foreground italic">"{p.pergunta}"</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{p.objetivo}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="alertas" className="mt-4 space-y-2">
              {fase.alertas.map((a, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-md border-l-2 border-seven-warning bg-seven-warning/5">
                  <AlertTriangle className="h-4 w-4 text-seven-warning shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-sm">{a}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Materiais transversais */}
      <div>
        <SectionHeader
          overline="Biblioteca geral"
          titulo="Materiais transversais Seven"
          className="mb-4"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MATERIAIS_GERAIS.map(g => {
            const Icon = ICONE_TIPO[g.tipo];
            const isIntegracao = g.categoria === 'integracao';
            return (
              <div
                key={g.id}
                className={`p-4 rounded-md border bg-background space-y-2 ${isIntegracao ? 'border-dashed' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isIntegracao
                      ? <Plug className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      : <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    }
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {labelCategoria[g.categoria]}
                    </span>
                  </div>
                  {isIntegracao && <StatusTag label="Em breve" variant="neutral" />}
                </div>
                <p className="text-sm font-medium">{g.titulo}</p>
                <p className="text-xs text-muted-foreground leading-snug">{g.descricao}</p>
                <p className="text-[10px] text-muted-foreground">Atualizado em {g.atualizadoEm}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Observações e Pendências da Metodologia */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1.5 rounded-full bg-seven-warning" />
            <h2 className="text-xl font-black uppercase tracking-tight">Observações e Pendências da Metodologia</h2>
          </div>
          {isAdmin && (
            <Button onClick={() => { setSelectedNote(null); setModalOpen(true); }} className="gap-2 bg-seven-warning hover:bg-seven-warning/90 text-black font-bold">
              <Plus className="h-4 w-4" />
              Novo Registro
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Filtros */}
            <div className="flex flex-wrap gap-4 items-end border-b pb-6 border-muted/60">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tipo</p>
                <div className="flex flex-wrap gap-2">
                  {['todos', 'observacao', 'pendencia', 'decisao_futura', 'risco', 'pergunta', 'ideia'].map(t => (
                    <button
                      key={t}
                      onClick={() => setFiltroTipo(t)}
                      className={`text-[10px] px-2 py-1 rounded-md border font-bold uppercase transition-all ${
                        filtroTipo === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      {t === 'todos' ? 'Todos' : t.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</p>
                <div className="flex flex-wrap gap-2">
                  {['todos', 'aberto', 'em_discussao', 'aprovado', 'resolvido'].map(s => (
                    <button
                      key={s}
                      onClick={() => setFiltroStatus(s)}
                      className={`text-[10px] px-2 py-1 rounded-md border font-bold uppercase transition-all ${
                        filtroStatus === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      {s === 'todos' ? 'Todos' : s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lista de Registros */}
            <div className="space-y-4">
              {notesFiltradas.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum registro metodológico encontrado com os filtros aplicados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {notesFiltradas.map(note => {
                    const typeIcons: any = {
                      observacao: MessageSquare,
                      pendencia: ClipboardList,
                      decisao_futura: Flag,
                      risco: AlertTriangle,
                      pergunta: HelpCircle,
                      ideia: Lightbulb
                    };
                    const NoteIcon = typeIcons[note.type] || MessageSquare;
                    
                    const priorityVariants: Record<string, StatusVariant> = {
                      baixa: 'neutral',
                      media: 'info',
                      alta: 'warning',
                      critica: 'danger'
                    };

                    const statusLabels: any = {
                      aberto: 'Aberto',
                      em_discussao: 'Em discussão',
                      aprovado: 'Aprovado',
                      descartado: 'Descartado',
                      resolvido: 'Resolvido'
                    };

                    const typeLabels: any = {
                      observacao: 'Observação',
                      pendencia: 'Pendência',
                      decisao_futura: 'Decisão futura',
                      risco: 'Risco',
                      pergunta: 'Pergunta',
                      ideia: 'Ideia'
                    };

                    return (
                      <div key={note.id} className="p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all border-muted/60 flex items-start gap-4">
                        <div className={`h-10 w-10 rounded-lg shrink-0 flex items-center justify-center ${
                          note.status === 'resolvido' ? 'bg-seven-success/10 text-seven-success' : 'bg-primary/10 text-primary'
                        }`}>
                          <NoteIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-sm leading-snug">{note.title}</h3>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <StatusTag label={statusLabels[note.status]} variant={note.status === 'resolvido' ? 'success' : 'info'} />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {note.description || 'Sem descrição.'}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <Badge variant="outline" className="text-[9px] uppercase tracking-tighter bg-muted/30">
                              {typeLabels[note.type]}
                            </Badge>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Prioridade:</span>
                              <StatusTag label={note.priority} variant={priorityVariants[note.priority]} />
                            </div>
                            <span className="text-[9px] text-muted-foreground">
                              {new Date(note.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex flex-col gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedNote(note); setModalOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteNote(note.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Banner de integrações */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-5 flex items-center gap-4">
          <Library className="h-8 w-8 text-muted-foreground shrink-0" strokeWidth={1.5} />
          <div className="flex-1">
            <p className="text-sm font-medium">Integrações em preparação</p>
            <p className="text-xs text-muted-foreground">Microsoft Calendar, Teams, Calendly e WhatsApp serão centralizados aqui para registrar reuniões, agendamentos e comunicações automaticamente.</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        </CardContent>
      </Card>

      <ModalMethodologyNote 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setSelectedNote(null); }}
        note={selectedNote}
        phases={METODOLOGIA.map(f => ({ id: f.id, name: f.nome }))}
      />
    </div>
  );
}
