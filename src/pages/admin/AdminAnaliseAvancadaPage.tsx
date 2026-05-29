import { useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusTag } from '@/components/StatusTag';
import {
  getAnalisePorRegiao, getAnalisePorEspecialidade,
  getCruzamentoTempoFase, getDistribuicaoEtapas,
} from '@/data/analisePerfil';
import { TrendingUp, TrendingDown, MapPin, Briefcase, Layers, GitCompare } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';

const PIE_COLORS = ['#A18261', '#3D4F5C', '#D4B896', '#5C6B5C', '#7A6A55'];

export default function AdminAnaliseAvancadaPage() {
  const regiao = useMemo(() => getAnalisePorRegiao(), []);
  const especialidade = useMemo(() => getAnalisePorEspecialidade(), []);
  const cruzamento = useMemo(() => getCruzamentoTempoFase(), []);
  const etapas = useMemo(() => getDistribuicaoEtapas(), []);

  const TIPOS = ['0-3m', '3-6m', '6-12m', '12m+'];

  return (
    <div>
      <PageHeader
        titulo="Análise Avançada"
        subtitulo="Crescimento, ticket e evolução por região e especialidade, cruzamento tempo × progresso e distribuição de etapas"
      />

      <Tabs defaultValue="regiao" className="space-y-6">
        <TabsList>
          <TabsTrigger value="regiao"><MapPin className="h-3.5 w-3.5 mr-1.5" />Região</TabsTrigger>
          <TabsTrigger value="especialidade"><Briefcase className="h-3.5 w-3.5 mr-1.5" />Especialidade</TabsTrigger>
          <TabsTrigger value="cruzamento"><GitCompare className="h-3.5 w-3.5 mr-1.5" />Tempo × Progresso</TabsTrigger>
          <TabsTrigger value="etapas"><Layers className="h-3.5 w-3.5 mr-1.5" />Etapas</TabsTrigger>
        </TabsList>

        <TabsContent value="regiao">
          <SectionHeader titulo="Análise por Região" descricao="Crescimento, ticket médio e evolução por região do país" />
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      <th className="text-left py-2 font-medium">Região</th>
                      <th className="text-right py-2 font-medium">Clientes</th>
                      <th className="text-right py-2 font-medium">Ticket médio</th>
                      <th className="text-right py-2 font-medium">Crescimento</th>
                      <th className="text-right py-2 font-medium">Índice médio</th>
                      <th className="text-right py-2 font-medium">Novos (6m)</th>
                      <th className="text-right py-2 font-medium">Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regiao.map(r => (
                      <tr key={r.chave} className="border-b border-border/40 hover:bg-secondary/30">
                        <td className="py-3 font-medium">{r.label}</td>
                        <td className="py-3 text-right tabular-nums">{r.qtdClientes}</td>
                        <td className="py-3 text-right tabular-nums">R$ {(r.ticketMedio / 1000).toFixed(0)}k</td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex items-center gap-1 tabular-nums ${r.crescimento >= 0 ? 'text-seven-success' : 'text-seven-danger'}`}>
                            {r.crescimento >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {r.crescimento > 0 ? '+' : ''}{r.crescimento}%
                          </span>
                        </td>
                        <td className="py-3 text-right tabular-nums">{r.evolucaoMedia}</td>
                        <td className="py-3 text-right tabular-nums">{r.contratosNovos}</td>
                        <td className="py-3 text-right tabular-nums">R$ {(r.receitaTotal / 1000).toFixed(0)}k</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="especialidade">
          <SectionHeader titulo="Análise por Especialidade" descricao="Performance e maturidade por área de atuação consultiva" />
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      <th className="text-left py-2 font-medium">Especialidade</th>
                      <th className="text-right py-2 font-medium">Clientes</th>
                      <th className="text-right py-2 font-medium">Ticket médio</th>
                      <th className="text-right py-2 font-medium">Crescimento</th>
                      <th className="text-right py-2 font-medium">Índice médio</th>
                      <th className="text-right py-2 font-medium">Novos (6m)</th>
                      <th className="text-right py-2 font-medium">Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {especialidade.map(e => (
                      <tr key={e.chave} className="border-b border-border/40 hover:bg-secondary/30">
                        <td className="py-3 font-medium">{e.label}</td>
                        <td className="py-3 text-right tabular-nums">{e.qtdClientes}</td>
                        <td className="py-3 text-right tabular-nums">R$ {(e.ticketMedio / 1000).toFixed(0)}k</td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex items-center gap-1 tabular-nums ${e.crescimento >= 0 ? 'text-seven-success' : 'text-seven-danger'}`}>
                            {e.crescimento >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {e.crescimento > 0 ? '+' : ''}{e.crescimento}%
                          </span>
                        </td>
                        <td className="py-3 text-right tabular-nums">{e.evolucaoMedia}</td>
                        <td className="py-3 text-right tabular-nums">{e.contratosNovos}</td>
                        <td className="py-3 text-right tabular-nums">R$ {(e.receitaTotal / 1000).toFixed(0)}k</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cruzamento">
          <SectionHeader titulo="Tempo de Contrato × Progresso Metodológico" descricao="Identifique clientes acelerados ou estagnados em relação ao tempo de contrato" />
          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    <th className="text-left py-2 font-medium">Tempo de contrato</th>
                    <th className="text-left py-2 font-medium">Fase atual</th>
                    <th className="text-right py-2 font-medium">Clientes</th>
                    <th className="text-left py-2 font-medium">Status</th>
                    <th className="text-left py-2 font-medium">Diagnóstico</th>
                  </tr>
                </thead>
                <tbody>
                  {cruzamento.map((c, i) => (
                    <tr key={i} className="border-b border-border/40 hover:bg-secondary/30">
                      <td className="py-3 font-medium">{c.faixaTempo}</td>
                      <td className="py-3">{c.faseLabel}</td>
                      <td className="py-3 text-right tabular-nums">{c.qtd}</td>
                      <td className="py-3">
                        <StatusTag
                          label={c.status === 'saudavel' ? 'Saudável' : c.status === 'atencao' ? 'Atenção' : 'Crítico'}
                          variant={c.status === 'saudavel' ? 'success' : c.status === 'atencao' ? 'warning' : 'danger'}
                        />
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">{c.diagnostico}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="etapas">
          <SectionHeader titulo="Distribuição por Etapa Metodológica" descricao="Visualização em pizza da carteira completa por fase" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Gráfico de pizza</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={etapas} dataKey="qtd" nameKey="label" cx="50%" cy="50%" outerRadius={110} label={(d) => `${d.label}: ${d.qtd}`}>
                      {etapas.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Detalhamento</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {etapas.map((e, i) => (
                    <li key={e.fase} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-3 w-3 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-sm font-medium">{e.label}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm tabular-nums">{e.qtd} <span className="text-xs text-muted-foreground">({e.pct}%)</span></p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
