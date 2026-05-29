import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { StatusTag } from '@/components/StatusTag';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/DataTable';
import {
  npsRegistros, feedbacksRelacionamento, atividadesRelacionamento,
  labelStatusTratativa, variantTratativa, labelCategoriaFb, variantCategoriaFb, labelCanal,
  gerarAlertasRelacionamento, configAlertasPadrao,
  type NpsRegistro, type FeedbackRegistrado, type AtividadeRelacionamento,
} from '@/data/relacionamentoNps';
import { clientes } from '@/data/mockData';
import { TrendingUp, AlertTriangle, MessageSquare, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function AdminRelacionamentoPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState(configAlertasPadrao);
  const alertas = useMemo(() => gerarAlertasRelacionamento(config), [config]);

  const ultimoTri = '2025-Q1';
  const npsUltimoTri = npsRegistros.filter(n => n.trimestre === ultimoTri && n.statusTratativa !== 'sem_resposta');
  const npsMedio = npsUltimoTri.length > 0
    ? Math.round(npsUltimoTri.reduce((s, n) => s + n.nota, 0) / npsUltimoTri.length * 10) / 10
    : 0;
  const semResposta = npsRegistros.filter(n => n.trimestre === ultimoTri && n.statusTratativa === 'sem_resposta').length;
  const reclamacoes = feedbacksRelacionamento.filter(f => f.categoria === 'reclamacao').length;

  const evolucaoTrimestral = useMemo(() => {
    const tris = ['2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1'];
    return tris.map(tri => {
      const itens = npsRegistros.filter(n => n.trimestre === tri && n.statusTratativa !== 'sem_resposta');
      const media = itens.length > 0 ? itens.reduce((s, n) => s + n.nota, 0) / itens.length : 0;
      return { tri, media: Math.round(media * 10) / 10 };
    });
  }, []);

  const npsCols: Column<NpsRegistro>[] = [
    { key: 'cli', header: 'Cliente', render: n => <span className="font-medium text-sm">{clientes.find(c => c.id === n.clienteId)?.nomeFantasia}</span> },
    { key: 'tri', header: 'Trimestre', render: n => <span className="text-xs">{n.trimestre}</span> },
    { key: 'nota', header: 'Nota', render: n => <span className={`font-mono text-sm ${n.nota === 0 ? 'text-muted-foreground' : n.nota >= 9 ? 'text-seven-success' : n.nota >= 7 ? 'text-foreground' : 'text-seven-danger'}`}>{n.nota === 0 ? '—' : n.nota}</span>, className: 'w-[70px]' },
    { key: 'com', header: 'Comentário', render: n => <span className="text-xs text-muted-foreground line-clamp-2">{n.comentario}</span> },
    { key: 'resp', header: 'Responsável', render: n => <span className="text-xs">{n.responsavel}</span> },
    { key: 'tra', header: 'Tratativa', render: n => <StatusTag label={labelStatusTratativa[n.statusTratativa]} variant={variantTratativa[n.statusTratativa]} />, className: 'w-[130px]' },
  ];

  const fbCols: Column<FeedbackRegistrado>[] = [
    { key: 'cli', header: 'Cliente', render: f => <span className="font-medium text-sm">{f.clienteNome}</span> },
    { key: 'cat', header: 'Categoria', render: f => <StatusTag label={labelCategoriaFb[f.categoria]} variant={variantCategoriaFb[f.categoria]} />, className: 'w-[130px]' },
    { key: 'tx', header: 'Feedback', render: f => <span className="text-xs">{f.texto}</span> },
    { key: 'arq', header: 'Anexo', render: f => f.arquivo ? <span className="text-[11px] text-muted-foreground">{f.arquivo}</span> : <span className="text-[11px] text-muted-foreground">—</span>, className: 'w-[140px]' },
    { key: 'data', header: 'Data', render: f => <span className="text-xs tabular-nums">{f.data}</span>, className: 'w-[100px]' },
    { key: 'resp', header: 'Responsável', render: f => <span className="text-xs">{f.responsavel}</span> },
  ];

  const atvCols: Column<AtividadeRelacionamento>[] = [
    { key: 'cli', header: 'Cliente', render: a => <span className="font-medium text-sm">{a.clienteNome}</span> },
    { key: 'can', header: 'Canal', render: a => <StatusTag label={labelCanal[a.canal]} variant="info" />, className: 'w-[110px]' },
    { key: 'data', header: 'Data', render: a => <span className="text-xs tabular-nums">{a.data}</span>, className: 'w-[100px]' },
    { key: 'obs', header: 'Observação', render: a => <span className="text-xs">{a.observacao}</span> },
    { key: 'pa', header: 'Próxima ação', render: a => <span className="text-xs text-muted-foreground">{a.proximaAcao || '—'}</span> },
    { key: 'resp', header: 'Responsável', render: a => <span className="text-xs">{a.responsavel}</span> },
  ];

  return (
    <div className="space-y-10">
      <PageHeader titulo="Relacionamento & NPS" subtitulo="Saúde do relacionamento com clientes" />

      <section>
        <SectionHeader overline="Visão geral" titulo="Indicadores de relacionamento" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard titulo="NPS médio (último tri)" valor={npsMedio || '—'} icon={TrendingUp} variant={npsMedio >= 8 ? 'success' : npsMedio >= 6 ? 'warning' : 'danger'} />
          <StatCard titulo="NPS sem resposta" valor={semResposta} icon={AlertTriangle} variant={semResposta > 0 ? 'warning' : 'success'} />
          <StatCard titulo="Reclamações" valor={reclamacoes} icon={MessageSquare} variant={reclamacoes > 2 ? 'danger' : 'warning'} />
          <StatCard titulo="Atividades 30d" valor={atividadesRelacionamento.filter(a => (Date.now() - new Date(a.data).getTime()) < 30 * 86400000).length} icon={Activity} />
        </div>
      </section>

      <section>
        <SectionHeader overline="Tendência" titulo="Evolução trimestral do NPS" />
        <Card>
          <CardContent className="pt-5 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucaoTrimestral}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="tri" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <RTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                <Line type="monotone" dataKey="media" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section>
        <SectionHeader overline="Sinais" titulo="Alertas de relacionamento" descricao="Configure os limites e veja os disparos" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Configuração</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="ui-overline">Dias sem contato (máx.)</Label>
                <Input type="number" value={config.diasSemContatoMax}
                  onChange={(e) => setConfig(c => ({ ...c, diasSemContatoMax: Number(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1">
                <Label className="ui-overline">Nota mínima NPS</Label>
                <Input type="number" value={config.notaNpsMin}
                  onChange={(e) => setConfig(c => ({ ...c, notaNpsMin: Number(e.target.value) || 0 }))} />
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Alertas ativos · {alertas.length}</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-[260px] overflow-auto">
              {alertas.length === 0 && <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>}
              {alertas.map(a => (
                <button key={a.id} className="w-full text-left flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors"
                  onClick={() => navigate(`/admin/cliente/${a.clienteId}`)}>
                  <span className={`h-2 w-2 rounded-full mt-1.5 ${a.variant === 'danger' ? 'bg-seven-danger' : 'bg-seven-warning'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{a.titulo}</p>
                    <p className="text-xs text-muted-foreground">{a.clienteNome} · {a.descricao}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <Tabs defaultValue="nps">
          <TabsList>
            <TabsTrigger value="nps">NPS · Histórico</TabsTrigger>
            <TabsTrigger value="feedback">Feedbacks</TabsTrigger>
            <TabsTrigger value="atividades">Atividades</TabsTrigger>
          </TabsList>
          <TabsContent value="nps" className="mt-4">
            <Card><CardContent className="p-0"><DataTable data={npsRegistros} columns={npsCols} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="feedback" className="mt-4">
            <Card><CardContent className="p-0"><DataTable data={feedbacksRelacionamento} columns={fbCols} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="atividades" className="mt-4">
            <Card><CardContent className="p-0"><DataTable data={atividadesRelacionamento} columns={atvCols} /></CardContent></Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}