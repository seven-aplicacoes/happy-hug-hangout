import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusTag } from '@/components/StatusTag';
import { ProgressBar } from '@/components/ProgressBar';
import { MethodologyStepper } from '@/components/MethodologyStepper';
import { SevenLogo } from '@/components/SevenLogo';
import { labelStatus } from '@/data/mockData';
import { useClientes } from '@/hooks/useClientes';
import { useContratos } from '@/hooks/useContratos';
import { useReunioes } from '@/hooks/useReunioes';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, CheckCircle2, Lightbulb, Building2, LogOut, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const HORAS_DISPONIVEIS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
const TIPOS_REUNIAO = ['Acompanhamento', 'Diagnóstico', 'Workshop', 'Alinhamento'];

interface PrintNps {
  id: string;
  nome: string;
  dataUpload: string;
  size: number;
  preview?: string;
}

export default function PortalClientePage() {
  const { clienteSession, loginCliente, logoutCliente } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [agendamento, setAgendamento] = useState({ data: '', startTime: '09:00', tipo: 'Acompanhamento', title: '' });
  const [prints, setPrints] = useState<PrintNps[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const { clientes, isLoading: loadingClientes } = useClientes();
  const { contratos, isLoading: loadingContratos } = useContratos();
  const { reunioes, isLoading: loadingReunioes } = useReunioes();

  const isLoading = loadingClientes || loadingContratos || loadingReunioes;

  const clienteAtual = useMemo(
    () => (clienteSession && clientes) ? clientes.find(c => c.id === clienteSession.clienteId) || null : null,
    [clienteSession, clientes],
  );

  const fazerLogin = async () => {
    setErro('');
    const res = await loginCliente(email, senha);
    if (!res.ok) setErro(res.erro || 'Erro ao entrar.');
  };

  const dadosCliente = useMemo(() => {
    if (!clienteAtual || !contratos || !reunioes) return null;
    const ct = contratos.find(c => c.clienteId === clienteAtual.id && c.status !== 'encerrado');
    const reunioesCl = reunioes.filter(r => r.clienteId === clienteAtual.id);
    const realizadas = reunioesCl.filter(r => r.status === 'realizada');
    const agendadas = reunioesCl.filter(r => r.status === 'agendada' && r.meetingDate >= new Date().toISOString().slice(0, 10));
    const horasConsumidas = realizadas.reduce((s, r) => s + r.duracao / 60, 0);
    const horasContratadas = 24;
    const maxEncontros = 8;
    const fasesIdx = ['diagnostico', 'planejamento', 'estruturacao', 'monitoramento', 'encerramento'].indexOf(clienteAtual.faseMetodologica);
    const progressoMet = ((fasesIdx + 1) / 5) * 100;
    return { ct, reunioesCl, realizadas, agendadas, horasConsumidas, horasContratadas, maxEncontros, progressoMet };
  }, [clienteAtual]);

  const agendar = () => {
    if (!agendamento.data || !agendamento.title.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    toast({ title: 'Reunião solicitada', description: `${agendamento.tipo} em ${agendamento.data} às ${agendamento.startTime}. Aguardando confirmação do consultor.` });
    setAgendamento({ data: '', startTime: '09:00', tipo: 'Acompanhamento', title: '' });
  };

  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const novos: PrintNps[] = [];
    Array.from(files).forEach(file => {
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      novos.push({
        id: `${Date.now()}-${file.name}`,
        nome: file.name,
        dataUpload: new Date().toISOString(),
        size: file.size,
        preview,
      });
    });
    setPrints(prev => [...novos, ...prev]);
    toast({ title: `${novos.length} arquivo(s) enviado(s)`, description: 'Seu consultor receberá uma notificação.' });
  };

  if (!clienteAtual) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-3"><SevenLogo fill="hsl(var(--foreground))" height={24} /></div>
            <CardTitle className="text-center">Portal do Cliente</CardTitle>
            <p className="text-center text-xs text-muted-foreground">Acompanhe sua jornada com a Seven</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="ui-overline">E-mail ou CNPJ</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@suaempresa.com.br" />
            </div>
            <div className="space-y-1.5">
              <Label className="ui-overline">Senha</Label>
              <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fazerLogin()} placeholder="••••••••" />
            </div>
            {erro && <p className="text-xs text-seven-danger">{erro}</p>}
            <Button className="w-full" onClick={fazerLogin}>Entrar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-[1100px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SevenLogo fill="hsl(var(--foreground))" height={18} />
            <div className="h-4 w-px bg-border" />
            <span className="text-xs font-medium flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{clienteAtual.nomeFantasia}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logoutCliente}>
            <LogOut className="h-3.5 w-3.5 mr-1" />Sair
          </Button>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 py-8 space-y-8">
        <div>
          <p className="ui-overline text-muted-foreground">Olá,</p>
          <h1 className="text-2xl font-light">{clienteAtual.nomeFantasia}</h1>
          <p className="text-sm text-muted-foreground">Status do contrato: <StatusTag label={labelStatus[clienteAtual.status]} /></p>
        </div>

        {dadosCliente && (
          <>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Sua jornada metodológica</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <MethodologyStepper faseAtual={clienteAtual.faseMetodologica} />
                <ProgressBar value={dadosCliente.progressoMet} />
                <p className="text-xs text-muted-foreground">{Math.round(dadosCliente.progressoMet)}% concluído · fase atual: {clienteAtual.faseMetodologica}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-5">
                  <p className="ui-overline mb-2">Horas consumidas</p>
                  <p className="text-2xl font-light">{dadosCliente.horasConsumidas.toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">de {dadosCliente.horasContratadas}h contratadas</p>
                  <ProgressBar value={(dadosCliente.horasConsumidas / dadosCliente.horasContratadas) * 100} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="ui-overline mb-2">Encontros realizados</p>
                  <p className="text-2xl font-light">{dadosCliente.realizadas.length}</p>
                  <p className="text-xs text-muted-foreground">de {dadosCliente.maxEncontros} disponíveis no ciclo</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="ui-overline mb-2">Próximas reuniões</p>
                  <p className="text-2xl font-light">{dadosCliente.agendadas.length}</p>
                  <p className="text-xs text-muted-foreground">já confirmadas</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" />Agendar encontro</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="ui-overline">Data</Label>
                      <Input type="date" value={agendamento.data} onChange={(e) => setAgendamento(a => ({ ...a, data: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="ui-overline">Horário</Label>
                      <select value={agendamento.startTime} onChange={(e) => setAgendamento(a => ({ ...a, startTime: e.target.value }))}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                        {HORAS_DISPONIVEIS.map(h => <option key={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="ui-overline">Tipo</Label>
                    <select value={agendamento.tipo} onChange={(e) => setAgendamento(a => ({ ...a, tipo: e.target.value }))}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      {TIPOS_REUNIAO.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="ui-overline">Pauta</Label>
                    <Input value={agendamento.title} onChange={(e) => setAgendamento(a => ({ ...a, title: e.target.value }))}
                      placeholder="O que gostaria de discutir?" />
                  </div>
                  <Button className="w-full" onClick={agendar}
                    disabled={dadosCliente.realizadas.length + dadosCliente.agendadas.length >= dadosCliente.maxEncontros}>
                    Solicitar agendamento
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Upload className="h-4 w-4" />Enviar feedback / prints de NPS</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Compartilhe prints de pesquisas, depoimentos ou evidências de resultado. Aceita imagens e PDFs.
                  </p>
                  <input
                    ref={fileRef} type="file" multiple accept="image/*,application/pdf"
                    className="hidden" onChange={(e) => handleUpload(e.target.files)}
                  />
                  <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5 mr-1.5" />Selecionar arquivos
                  </Button>
                  {prints.length > 0 && (
                    <ul className="space-y-2 mt-3 max-h-[200px] overflow-auto">
                      {prints.map(p => (
                        <li key={p.id} className="flex items-center gap-2 p-2 rounded border border-border">
                          {p.preview
                            ? <img src={p.preview} alt={p.nome} className="h-10 w-10 rounded object-cover" />
                            : <div className="h-10 w-10 rounded bg-muted flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{p.nome}</p>
                            <p className="text-[10px] text-muted-foreground">{(p.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setPrints(prev => prev.filter(x => x.id !== p.id))}>
                            <X className="h-3 w-3" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Histórico de reuniões</CardTitle></CardHeader>
              <CardContent>
                {dadosCliente.realizadas.length === 0
                  ? <p className="text-sm text-muted-foreground">Sem reuniões realizadas ainda.</p>
                  : (
                    <div className="space-y-2 max-h-[300px] overflow-auto">
                      {dadosCliente.realizadas.slice(0, 12).map(r => (
                        <div key={r.id} className="flex items-center justify-between p-2 border-b border-border last:border-0">
                          <div>
                            <p className="text-sm font-medium">{r.tipo}</p>
                            <p className="text-xs text-muted-foreground">{r.title}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs tabular-nums">{r.meetingDate} · {r.startTime}</p>
                            <p className="text-[11px] text-muted-foreground">{r.duracao} min</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
