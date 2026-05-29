import { useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { IaInsightCard } from '@/components/IaInsightCard';
import { StatusTag } from '@/components/StatusTag';
import { getRelatorioSemanal, getRecomendacoesPorPerfil } from '@/data/relatorioSemanalIA';
import { Sparkles, AlertTriangle, TrendingUp, Calendar, FileSignature } from 'lucide-react';

export default function AdminIAPage() {
  const rel = useMemo(() => getRelatorioSemanal(), []);
  const recs = useMemo(() => getRecomendacoesPorPerfil(), []);

  return (
    <div className="space-y-10">
      <PageHeader titulo="IA Analítica" subtitulo={`Resumo executivo da semana — ${rel.semanaLabel}`}>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary bg-primary/10 px-3 py-1.5 rounded-full">
          <Sparkles className="h-3 w-3" /> Powered by AI
        </span>
      </PageHeader>

      <section className="space-y-5">
        <SectionHeader overline="Relatório semanal" titulo="Visão executiva" descricao={rel.destaque} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard titulo="Riscos críticos" valor={rel.riscosCriticos} variant="danger" icon={AlertTriangle} />
          <StatCard titulo="Oportunidades" valor={rel.oportunidades} variant="success" icon={TrendingUp} />
          <StatCard titulo="Novos clientes (7d)" valor={rel.novosClientes} variant="info" icon={Calendar} />
          <StatCard titulo="Contratos vencendo (30d)" valor={rel.contratosVencendo} variant="warning" icon={FileSignature} />
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeader overline="Inteligência" titulo="Riscos e oportunidades destacados" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-3">
            <p className="ui-overline text-seven-danger">Riscos da semana</p>
            {rel.riscosTop.length ? rel.riscosTop.map(i => <IaInsightCard key={i.id} insight={i} />)
              : <Card><CardContent className="p-6 text-xs text-muted-foreground italic">Sem riscos críticos esta semana.</CardContent></Card>}
          </div>
          <div className="space-y-3">
            <p className="ui-overline text-seven-success">Oportunidades</p>
            {rel.oportunidadesTop.length ? rel.oportunidadesTop.map(i => <IaInsightCard key={i.id} insight={i} />)
              : <Card><CardContent className="p-6 text-xs text-muted-foreground italic">Sem oportunidades destacadas.</CardContent></Card>}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeader overline="Recomendações por perfil" titulo="Ações sugeridas" descricao="Próximos passos priorizados por papel." />
        <Tabs defaultValue={recs[0]?.perfil}>
          <TabsList>
            {recs.map(r => <TabsTrigger key={r.perfil} value={r.perfil}>{r.perfilLabel}</TabsTrigger>)}
          </TabsList>
          {recs.map(r => (
            <TabsContent key={r.perfil} value={r.perfil} className="space-y-3 mt-4">
              {r.itens.length ? r.itens.map((it, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <StatusTag label={it.prioridade === 'alta' ? 'Alta' : it.prioridade === 'media' ? 'Média' : 'Baixa'}
                      variant={it.prioridade === 'alta' ? 'danger' : it.prioridade === 'media' ? 'warning' : 'info'} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{it.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-1">{it.descricao}</p>
                    </div>
                  </CardContent>
                </Card>
              )) : <p className="text-xs text-muted-foreground italic">Sem recomendações ativas.</p>}
            </TabsContent>
          ))}
        </Tabs>
      </section>

      <section className="space-y-5">
        <SectionHeader overline="Insights" titulo="Todos os insights gerados" descricao={`${rel.insights.length} insights processados nesta análise.`} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rel.insights.map(i => <IaInsightCard key={i.id} insight={i} />)}
        </div>
      </section>
    </div>
  );
}
