import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PerfilUsuario } from '@/types';

interface ProfileSwitcherProps {
  perfisDisponiveis?: PerfilUsuario[];
}

/**
 * Seletor compacto de visão (Administrador / Consultor).
 * - Aparece apenas quando o usuário tem acesso a 2+ perfis.
 * - Troca o perfil ativo no AuthContext e redireciona ao dashboard correspondente.
 */
export const ProfileSwitcher = ({
  perfisDisponiveis = ['admin', 'consultor'],
}: ProfileSwitcherProps) => {
  const { user, perfil, selecionarPerfil } = useAuth();
  const navigate = useNavigate();

  const isOnlyConsultor = user?.role === 'consultor';
  if (!perfisDisponiveis || perfisDisponiveis.length < 2 || isOnlyConsultor) return null;

  const handleSwitch = (novo: PerfilUsuario) => {
    if (novo === perfil) return;
    selecionarPerfil(novo);
    navigate(novo === 'admin' ? '/admin/dashboard' : '/consultor/dashboard');
  };

  const opcoes: { value: PerfilUsuario; label: string; icon: typeof ShieldCheck }[] = (
    [
      { value: 'admin', label: 'Administrador', icon: ShieldCheck },
      { value: 'consultor', label: 'Consultor', icon: UserCircle },
    ] as { value: PerfilUsuario; label: string; icon: typeof ShieldCheck }[]
  ).filter((o) => perfisDisponiveis.includes(o.value));

  return (
    <div
      role="group"
      aria-label="Trocar visão de perfil"
      className="inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-background/60 p-0.5"
    >
      <span className="hidden md:inline-block pl-2 pr-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
        Visão
      </span>
      {opcoes.map((o) => {
        const ativo = perfil === o.value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => handleSwitch(o.value)}
            aria-pressed={ativo}
            className={cn(
              'inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-[12px] transition-colors',
              ativo
                ? 'bg-foreground text-background font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
};
