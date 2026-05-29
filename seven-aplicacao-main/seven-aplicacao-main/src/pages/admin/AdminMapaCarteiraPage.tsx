import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { MapaRiscoMatriz } from '@/components/MapaRiscoMatriz';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ZAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  clientes, contratos, consultores, calcularEngajamento, diasDesdeUltimaReuniao,
  labelEspecialidade, labelRegiao,
} from '@/data/mockData';
import { Map, Users, AlertTriangle, TrendingUp } from 'lucide-react';

const ENG_COLOR: Record<string, string> = {
  em_dia: 'hsl(var(--seven-success))',
  atencao: 'hsl(var(--seven-warning))',
  critico: 'hsl(var(--seven-danger))',
};
const ENG_LABEL: Record<string, string> = { em_dia: 'Em dia', atencao: 'Atenção', critico: 'Crítico' };

export default function AdminMapaCarteiraPage() {
  const navigate = useNavigate();
  const [consultorFiltro, setConsultorFiltro] = useState<string>('todos');
  const [engFiltro, setEngFiltro] = useState<string>('todos');

  const dadosFiltrados = useMemo(() => {
    return clientes
      .filter(cl => cl.status !== 'encerrado' && cl.status !== 'churn' && cl.status !== 'cancelado')
      .filter(cl => consultorFiltro === 'todos' || cl.consultorId === consultorFiltro)
      .map(cl => {
        const eng = calcularEngajamento(cl.id);
        const ct = contratos.find(c => c.clienteId === cl.id && c.status !== 'encerrado');
        return {
          id: cl.id,
          nome: cl.nomeFantasia,
          x: cl.indiceSeven,
          y: cl.faturamentoMensal / 1000, // R$ k
          z: ct ? ct.valor : 20000,
          eng,
          consultor: cl.consultorNome,
          regiao: cl.regiao,
          especialidade: cl.especialidade,
          dias: diasDesdeUltimaReuniao(cl.id),
        };
      })
      .filter(d => engFiltro === 'todos' || d.eng === engFiltro);
  }, [consultorFiltro, engFiltro]);

  const grupos = (['em_dia', 'atencao', 'critico'] as const).map(eng => ({
    eng,
    label: ENG_LABEL[eng],
    color: ENG_COLOR[eng],
    items: dadosFiltrados.filter(d => d.eng === eng),
  }));

  const total = dadosFiltrados.length;
  const pctEmDia = total ? Math.round((grupos[0].items.length / total) * 100) : 0;
  const criticos = grupos[2].items.length;

  // Heatmap região × especialidade
  const heatmap = useMemo(() => {
    const regioes = Object.keys(labelRegiao);
    const esps = Object.keys(labelEspecialidade);
    const map: Record<string, Record<string, number>> = {};
    regioes.forEach(r => { map[r] = {}; esps.forEach(e => { map[r][e] = 0; }); });
    dadosFiltrados.forEach(d => {
      if (map[d.regiao] && map[d.regiao][d.especialidade] !== undefined) {
        map[d.regiao][d.especialidade]++;
      }
    });
    const max = Math.max(1, ...regioes.flatMap(r => esps.map(e => map[r][e])));
    return { regioes, esps, map, max };
  }, [dadosFiltrados]);

  return (
    <div>
      <PageHeader
        titulo="Mapa da Carteira"
        subtitulo="Visão geográfica e estratégica de toda a base de clientes"
      >
        <Select value={consultorFiltro} onValueChange={setConsultorFiltro}>
          <SelectTrigger className="w-[200px] h-9 text-xs"><SelectValue placeholder="Usuário" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos usuários</SelectItem>
            {consultores.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={engFiltro} onValueChange={setEngFiltro}>
          <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Engajamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos engajamentos</SelectItem>
            <SelectItem value="em_dia">Em dia</SelectItem>
            <SelectItem value="atencao">Atenção</SelectItem>
            <SelectItem value="critico">Crítico</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard titulo="Clientes na visão" valor={total} icon={Users} />
        <StatCard titulo="% em dia" valor={`${pctEmDia}%`} icon={TrendingUp} variant="success" />
        <StatCard titulo="Em atenção" valor={grupos[1].items.length} icon={Map} variant="warning" />
        <StatCard titulo="Críticos" valor={criticos} icon={AlertTriangle} variant="danger" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base font-medium">Mapa estratégico — Índice Seven × Faturamento</CardTitle>
          <p className="text-xs text-muted-foreground">Tamanho = valor de contrato · Cor = engajamento. Clique em uma bolha para abrir o cliente.</p>
        </CardHeader>
        <CardContent>
          <div className="h-[460px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" />
                <XAxis
                  type="number" dataKey="x" name="Índice Seven" domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Índice Seven', position: 'bottom', offset: 0, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  type="number" dataKey="y" name="Faturamento (R$ k/mês)"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'R$ k/mês', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <ZAxis type="number" dataKey="z" range={[80, 480]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-md bg-card border border-border px-3 py-2 shadow-md text-xs">
                        <p className="font-medium text-foreground">{d.nome}</p>
                        <p className="text-muted-foreground">Índice {d.x} · R$ {d.y.toLocaleString('pt-BR')}k/mês</p>
                        <p className="text-muted-foreground">{ENG_LABEL[d.eng]} · {d.dias}d sem reunião</p>
                        <p className="text-muted-foreground">{d.consultor}</p>
                      </div>
                    );
                  }}
                />
                {grupos.map(g => (
                  <Scatter
                    key={g.eng}
                    name={g.label}
                    data={g.items}
                    fill={g.color}
                    onClick={(p: any) => p?.id && navigate(`/admin/cliente/${p.id}`)}
                    cursor="pointer"
                  >
                    {g.items.map((_, i) => (<Cell key={i} fillOpacity={0.75} />))}
                  </Scatter>
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-3 pl-2">
            {grupos.map(g => (
              <div key={g.eng} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.color }} />
                {g.label} · {g.items.length}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <SectionHeader titulo="Distribuição geográfica" descricao="Concentração por região e especialidade" />
      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left p-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Região</th>
                {heatmap.esps.map(e => (
                  <th key={e} className="text-center p-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {labelEspecialidade[e]}
                  </th>
                ))}
                <th className="text-center p-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {heatmap.regioes.map(r => {
                const total = heatmap.esps.reduce((s, e) => s + heatmap.map[r][e], 0);
                return (
                  <tr key={r} className="border-t border-border/50">
                    <td className="p-2 font-medium text-foreground">{labelRegiao[r]}</td>
                    {heatmap.esps.map(e => {
                      const v = heatmap.map[r][e];
                      const intensity = v / heatmap.max;
                      return (
                        <td key={e} className="p-1.5 text-center">
                          <div
                            className="h-9 rounded-sm flex items-center justify-center font-medium tabular-nums"
                            style={{
                              background: v ? `hsl(var(--primary) / ${0.08 + intensity * 0.5})` : 'hsl(var(--muted) / 0.4)',
                              color: intensity > 0.55 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                            }}
                          >
                            {v || '·'}
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-2 text-center font-medium tabular-nums">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <MapaRiscoMatriz />
    </div>
  );
}

