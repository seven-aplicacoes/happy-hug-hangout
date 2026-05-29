import { useState } from 'react';
import { BaseModal } from '@/components/BaseModal';
import { StatusTag } from '@/components/StatusTag';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { labelStatus } from '@/data/mockData';
import { AlertTriangle, CalendarDays, Ban, Bell } from 'lucide-react';
import type { StatusContrato } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  clienteNome: string;
  statusAtual: StatusContrato;
  onConfirm?: (novoStatus: StatusContrato, motivo: string) => void;
}

const statusOptions: { value: StatusContrato; label: string }[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'em_onboarding', label: 'Em onboarding' },
  { value: 'em_renovacao', label: 'Em renovação' },
  { value: 'renovado', label: 'Renovado' },
  { value: 'bloqueado', label: 'Bloqueado' },
  { value: 'suspenso', label: 'Suspenso' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'churn', label: 'Churn' },
  { value: 'encerrado', label: 'Encerrado' },
];

export const ModalAlterarStatus = ({ open, onClose, clienteNome, statusAtual, onConfirm }: Props) => {
  const [novoStatus, setNovoStatus] = useState<StatusContrato>(statusAtual);
  const [motivo, setMotivo] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [origem, setOrigem] = useState('gestao');

  const isBloqueio = novoStatus === 'bloqueado' || novoStatus === 'suspenso' || novoStatus === 'cancelado' || novoStatus === 'churn';
  const mudou = novoStatus !== statusAtual;

  const handleConfirmar = () => {
    if (!mudou) {
      toast({ title: 'Selecione um novo status', variant: 'destructive' });
      return;
    }
    if (!motivo.trim()) {
      toast({ title: 'Motivo obrigatório', description: 'Informe o motivo da alteração.', variant: 'destructive' });
      return;
    }
    onConfirm?.(novoStatus, motivo);
    toast({
      title: isBloqueio ? 'Cliente bloqueado' : 'Status alterado',
      description: `${clienteNome} alterado para "${labelStatus[novoStatus]}".`,
    });
    onClose();
  };

  return (
    <BaseModal open={open} onClose={onClose} titulo="Alterar Status do Cliente" descricao={`Alteração de status — ${clienteNome}`}>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {/* Status atual */}
        <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 border">
          <span className="text-sm text-muted-foreground">Status atual:</span>
          <StatusTag label={labelStatus[statusAtual]} />
        </div>

        {/* Novo status */}
        <div className="space-y-0.5">
          <Label>Novo status *</Label>
          <Select value={novoStatus} onValueChange={(v) => setNovoStatus(v as StatusContrato)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {statusOptions.filter(s => s.value !== statusAtual).map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Motivo */}
        <div className="space-y-0.5">
          <Label>Motivo da alteração *</Label>
          <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Descreva o motivo da mudança de status..." rows={3} />
        </div>

        {/* Data e Origem */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <Label>Data da alteração</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-0.5">
            <Label>Origem</Label>
            <Select value={origem} onValueChange={setOrigem}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gestao">Decisão da Gestão</SelectItem>
                <SelectItem value="cliente">Solicitação do Cliente</SelectItem>
                <SelectItem value="contratual">Cláusula Contratual</SelectItem>
                <SelectItem value="financeiro">Inadimplência</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Consequências do bloqueio */}
        {isBloqueio && mudou && (
          <Card className="border-seven-danger/30 bg-seven-danger/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-seven-danger" />
                <span className="text-sm font-bold text-seven-danger">Consequências do bloqueio</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CalendarDays className="h-4 w-4 text-seven-danger mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Impacto em reuniões</p>
                    <p className="text-xs text-muted-foreground">Reuniões agendadas serão automaticamente canceladas. Nenhuma nova reunião poderá ser agendada enquanto o bloqueio estiver ativo.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Ban className="h-4 w-4 text-seven-danger mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Impacto operacional</p>
                    <p className="text-xs text-muted-foreground">Tarefas ativas serão movidas para "Impedida". Novos chamados não serão aceitos.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Bell className="h-4 w-4 text-seven-danger mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Notificações</p>
                    <p className="text-xs text-muted-foreground">O consultor responsável e a gestão serão notificados automaticamente sobre a mudança de status.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          variant={isBloqueio ? 'destructive' : 'default'}
          onClick={handleConfirmar}
          disabled={!mudou}
        >
          {isBloqueio ? 'Confirmar Bloqueio' : 'Alterar Status'}
        </Button>
      </div>
    </BaseModal>
  );
};
