import { StatusTag } from '@/components/StatusTag';
import { labelFase, labelStatus, labelEngajamento, calcularEngajamento } from '@/data/mockData';
import type { Cliente } from '@/types';
import { Building2, MapPin, User } from 'lucide-react';

interface ClientSummary30sProps {
  cliente: Cliente;
}

export const ClientSummary30s = ({ cliente }: ClientSummary30sProps) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <span className="font-semibold text-foreground">{cliente.nomeFantasia}</span>
      <StatusTag label={labelStatus[cliente.status]} />
    </div>
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {cliente.consultorNome}</span>
      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {cliente.segmento}</span>
      <span>Fase: {labelFase[cliente.faseMetodologica]}</span>
      <span>Engajamento: {labelEngajamento[calcularEngajamento(cliente.id)]}</span>
      <span>Índice Seven: {cliente.indiceSeven}</span>
    </div>
  </div>
);
