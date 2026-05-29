import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Users, ArrowUpRight, Loader2 } from 'lucide-react';
import { SevenLogo } from '@/components/SevenLogo';

export default function SelecionarAmbientePage() {
  const { selecionarPerfil } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const select = async (perfil: 'admin' | 'consultor') => {
    setLoading(perfil);
    selecionarPerfil(perfil);

    if (perfil === 'admin') {
      navigate('/admin/dashboard');
    } else {
      // For consultants, find the first module they have access to
      try {
        const { data: { user } } = await import('@/integrations/supabase/client').then(m => m.supabase.auth.getUser());
        if (user) {
          const { data: permissions } = await import('@/integrations/supabase/client').then(m => 
            m.supabase.from('consultant_permissions').select('module_key').eq('consultant_id', user.id).eq('can_view', true).order('created_at')
          );
          
          if (permissions && permissions.length > 0) {
            // Find path for module_key
            const modulePaths: Record<string, string> = {
              dashboard: '/consultor/dashboard',
              clientes: '/consultor/clientes',
              reunioes: '/consultor/reunioes',
              tarefas: '/consultor/tarefas',
              documentos: '/consultor/documentos',
              metodologia: '/consultor/metodologia',
              perfil: '/consultor/meu-perfil'
            };
            
            const firstModule = permissions[0].module_key;
            const path = modulePaths[firstModule] || '/consultor/dashboard';
            navigate(path);
          } else {
            navigate('/consultor/dashboard');
          }
        } else {
          navigate('/consultor/dashboard');
        }
      } catch (error) {
        console.error('Error determining first module:', error);
        navigate('/consultor/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-foreground text-background">
      <header className="px-8 py-6 flex items-center">
        <SevenLogo fill="white" height={22} />
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl space-y-12">
          <div className="space-y-3 text-center max-w-xl mx-auto">
            <p className="ui-overline text-background/50">Selecionar ambiente</p>
            <h1 className="font-editorial text-4xl sm:text-5xl leading-[1.1]">
              Como deseja
              <span className="font-editorial-italic text-primary"> acessar </span>
              hoje?
            </h1>
            <p className="text-sm text-background/60 max-w-md mx-auto">
              Cada ambiente é otimizado para o seu papel na operação Seven.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => select('admin')}
              disabled={!!loading}
              className="group relative text-left bg-background text-foreground p-8 rounded-lg border border-background/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-editorial disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="h-11 w-11 rounded-md bg-foreground/[0.04] flex items-center justify-center">
                  {loading === 'admin' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5 text-foreground" strokeWidth={1.5} />}
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.5} />
              </div>
              <p className="ui-overline mb-1">Perfil</p>
              <h2 className="font-editorial text-2xl leading-tight mb-2">Administrador</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Visão executiva, gestão de projetos e inteligência de mercado.
              </p>
            </button>

            <button
              onClick={() => select('consultor')}
              disabled={!!loading}
              className="group relative text-left bg-background text-foreground p-8 rounded-lg border border-background/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-editorial disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="h-11 w-11 rounded-md bg-seven-cream flex items-center justify-center">
                  {loading === 'consultor' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Users className="h-5 w-5 text-foreground" strokeWidth={1.5} />}
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.5} />
              </div>
              <p className="ui-overline mb-1">Perfil</p>
              <h2 className="font-editorial text-2xl leading-tight mb-2">Consultor</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sua carteira, reuniões, tarefas e produtividade tática.
              </p>
            </button>
          </div>
        </div>
      </div>

      <footer className="px-8 py-6 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-background/40">
        <span>Seven Gestão</span>
        <span>Acesso restrito</span>
      </footer>
    </div>
  );
}
