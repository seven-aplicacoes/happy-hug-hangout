import { getFriendlyError } from '@/lib/friendlyErrors';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { SevenLogo } from '@/components/SevenLogo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Lock, Mail, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, selecionarPerfil, setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha e-mail e senha.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (authError) throw authError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      setUser({
        id: profile.id,
        email: profile.email,
        nome: profile.full_name,
        role: profile.role,
        consultorId: profile.id, // Assuming profile ID is used as consultor ID
      });

      const ok = await login(email, senha);
      
      if (ok) {
        if (profile.role === 'admin') {
          selecionarPerfil('admin');
          navigate('/admin/dashboard');
        } else if (profile.role === 'consultor') {
          selecionarPerfil('consultor');
          
          const { data: permissions } = await supabase
            .from('consultant_permissions')
            .select('module_key')
            .eq('consultant_id', profile.id)
            .eq('can_view', true);
            
          const modulePaths: Record<string, string> = {
            dashboard: '/consultor/dashboard',
            clientes: '/consultor/clientes',
            reunioes: '/consultor/reunioes',
            tarefas: '/consultor/tarefas',
            documentos: '/consultor/documentos',
            metodologia: '/consultor/metodologia',
            perfil: '/consultor/meu-perfil'
          };

          // Define priority order for redirection
          const priorityOrder = ['dashboard', 'clientes', 'reunioes', 'tarefas', 'documentos', 'metodologia', 'perfil'];
          
          const allowedModule = priorityOrder.find(key => 
            permissions?.some(p => p.module_key === key)
          );

          if (allowedModule) {
            navigate(modulePaths[allowedModule]);
          } else {
            navigate('/no-access');
          }
        } else {
          navigate('/portal');
        }
      }
    } catch (error: any) {
      { const f = getFriendlyError(error, 'login'); toast({ title: f.title, description: f.description, variant: 'destructive' }); }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Editorial side — black canvas with serif statement */}
      <div className="hidden lg:flex flex-col justify-between bg-foreground text-background p-12 relative overflow-hidden">
        <div className="flex items-center">
          <SevenLogo fill="white" height={24} />
        </div>

        <div className="space-y-8 max-w-lg relative z-10">
          <p className="ui-overline text-background/50">Plataforma Seven Gestão</p>
          <h2 className="font-editorial text-4xl xl:text-5xl leading-[1.05] tracking-tight">
            Método, governança<br />
            e clareza <span className="font-editorial-italic text-primary">em cada decisão.</span>
          </h2>
          <p className="text-sm text-background/60 leading-relaxed max-w-md">
            Visão executiva consolidada para administradores e consultores. Acesso restrito.
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-background/40">
          <span>Seven Gestão</span>
          <span>2026</span>
        </div>

        {/* discreet warm accent corner */}
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-10">
          <div className="lg:hidden flex justify-center">
            <SevenLogo fill="black" height={24} />
          </div>

          <div className="space-y-2">
            <p className="ui-overline">Acesso</p>
            <h1 className="font-editorial text-4xl text-foreground leading-tight">
              Bem-vindo.
            </h1>
            <p className="text-sm text-muted-foreground">Sistema de Gestão Seven.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                E-mail corporativo
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@seven.com"
                  className="pl-9 h-11 border-border focus-visible:border-foreground focus-visible:ring-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 h-11 border-border focus-visible:border-foreground focus-visible:ring-1"
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar no sistema'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => navigate('/portal')}
            >
              <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
              Acessar portal do cliente
            </Button>
            <div className="flex justify-center text-xs pt-2">
              <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">Esqueci minha senha</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
