import { StatusTag } from '@/components/StatusTag';
import { labelFase, labelStatus, labelEngajamento, calcularEngajamento } from '@/data/mockData';
import type { Cliente } from '@/types';
import { User, MapPin } from 'lucide-react';

interface ClientSummary30sProps {
  cliente: Cliente;
}

export const ClientSummary30s = ({ cliente }: ClientSummary30sProps) => (
  <div className="flex gap-3">
    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden border border-muted/20">
      {cliente.avatar_url ? (
        <img src={cliente.avatar_url} alt={cliente.nomeFantasia} className="h-full w-full object-cover" />
      ) : (
        (cliente.nomeFantasia || 'C').charAt(0).toUpperCase()
      )}
    </div>
    <div className="space-y-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground truncate">{cliente.nomeFantasia}</span>
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
  </div>
);
