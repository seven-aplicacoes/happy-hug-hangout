import { BaseModal } from '@/components/BaseModal';
import { StatusTag } from '@/components/StatusTag';
import { labelStatus } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';
import type { Reuniao } from '@/types';
import { Calendar, Clock, Users, FileText, Video } from 'lucide-react';
import { AvaliacaoIaReuniaoCard } from '@/components/AvaliacaoIaReuniaoCard';

interface Props {
  open: boolean;
  onClose: () => void;
  reuniao: Reuniao;
}

export const ModalVerDetalhesReuniao = ({ open, onClose, reuniao }: Props) => (
  <BaseModal open={open} onClose={onClose} titulo="Detalhes da Reunião" descricao={`${reuniao.clienteNome} — ${reuniao.tipo}`}>
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Informações gerais */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span><span className="text-muted-foreground">Data:</span> {reuniao.meetingDate}</span></div>
        <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span><span className="text-muted-foreground">Hora:</span> {reuniao.startTime} ({reuniao.duracao} min)</span></div>
        <div><span className="text-muted-foreground">Tipo:</span> {reuniao.tipo}</div>
        <div><span className="text-muted-foreground">Status:</span> <StatusTag label={labelStatus[reuniao.status]} /></div>
        <div><span className="text-muted-foreground">Consultor:</span> {reuniao.consultorNome}</div>
        <div><span className="text-muted-foreground">Contrato:</span> {reuniao.contractId}</div>
        {reuniao.meetingUrl && (
          <div className="col-span-2 flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            <a href={reuniao.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
              Link da Reunião
            </a>
          </div>
        )}
      </div>

      {/* Participantes */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">Participantes</span></div>
          <div className="flex flex-wrap gap-2">
            {reuniao.participantes.map((p, i) => (
              <span key={i} className="text-xs bg-muted px-2 py-1 rounded-full">{p}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pauta */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2"><FileText className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">Pauta</span></div>
          <p className="text-sm text-muted-foreground">{reuniao.title}</p>
        </CardContent>
      </Card>

      {/* Avaliação IA — apenas reuniões realizadas */}
      {reuniao.status === 'realizada' && <AvaliacaoIaReuniaoCard reuniaoId={reuniao.id} />}

      {/* Ata (modo leitura protegida) */}
      {reuniao.ata && (
        <Card className="border-l-4 border-l-seven-success">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><FileText className="h-4 w-4 text-seven-success" /><span className="text-sm font-semibold">Ata da Reunião</span><span className="text-xs text-muted-foreground">(modo leitura)</span></div>
            <p className="text-sm">{reuniao.ata}</p>
          </CardContent>
        </Card>
      )}

      {/* Evidência */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2"><Video className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">Evidência</span></div>
          <p className="text-sm text-muted-foreground">{reuniao.status === 'realizada' ? 'Gravação vinculada (simulado)' : 'Nenhuma evidência disponível'}</p>
        </CardContent>
      </Card>
    </div>
  </BaseModal>
);
