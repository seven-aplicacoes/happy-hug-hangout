import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { regrasNotificacaoPadrao, descreveJanela, labelCanal, type RegraNotificacao } from '@/data/notificacoesReuniao';
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const canaisIcon = { email: Mail, sms: MessageSquare, push: Smartphone };

export default function AdminNotificacoesPage() {
  const [regras, setRegras] = useState<RegraNotificacao[]>(regrasNotificacaoPadrao);

  const toggleAtiva = (id: string) =>
    setRegras(prev => prev.map(r => r.id === id ? { ...r, ativa: !r.ativa } : r));

  const toggleCanal = (id: string, canal: 'email' | 'sms' | 'push') =>
    setRegras(prev => prev.map(r => {
      if (r.id !== id) return r;
      const has = r.canais.includes(canal);
      return { ...r, canais: has ? r.canais.filter(c => c !== canal) : [...r.canais, canal] };
    }));

  const editTemplate = (id: string, template: string) =>
    setRegras(prev => prev.map(r => r.id === id ? { ...r, template } : r));

  return (
    <div className="space-y-10">
      <PageHeader titulo="Notificações de reunião" subtitulo="Regras automáticas de lembrete" />

      <Card className="bg-muted/40">
        <CardContent className="p-4 flex items-start gap-3">
          <Bell className="h-4 w-4 text-primary mt-0.5" strokeWidth={1.5} />
          <div className="text-xs text-muted-foreground">
            Estas regras definem quando o sistema dispara lembretes para clientes e consultores.
            Os disparos reais (e-mail, SMS, push) ainda não estão conectados — esta tela representa a configuração e o estado.
          </div>
        </CardContent>
      </Card>

      <section>
        <SectionHeader overline="Regras configuráveis" titulo="Janelas de antecedência" />
        <div className="space-y-3">
          {regras.map(r => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    Lembrete · {descreveJanela(r)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Ativa</Label>
                    <Switch checked={r.ativa} onCheckedChange={() => toggleAtiva(r.id)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="ui-overline mb-2 block">Canais</Label>
                  <div className="flex gap-4">
                    {(['email', 'sms', 'push'] as const).map(c => {
                      const Icon = canaisIcon[c];
                      return (
                        <label key={c} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={r.canais.includes(c)} onCheckedChange={() => toggleCanal(r.id, c)} />
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                          <span className="text-xs">{labelCanal[c]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label className="ui-overline mb-1 block">Template</Label>
                  <Textarea value={r.template} onChange={(e) => editTemplate(r.id, e.target.value)} rows={2} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={() => toast({ title: 'Configuração salva', description: 'As novas regras valem para próximas reuniões.' })}>Salvar configuração</Button>
        </div>
      </section>
    </div>
  );
}