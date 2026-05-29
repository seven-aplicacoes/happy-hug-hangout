import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import { LayoutDashboard, FolderKanban, TrendingUp, Users, LogOut, Menu, ShieldAlert, Map, GitBranch, BookOpen, FileText, Heart, Bell, Plug, FileSignature, Sparkles, RefreshCw, BarChart3, ShieldCheck, FileCheck, Clock, ChevronRight, Rocket, Briefcase, Activity, BarChart, Settings, Loader2 } from 'lucide-react';
import { useMyPermissions, ADMIN_MODULES_CONFIG } from '@/hooks/useConsultantPermissions';
import { Button } from '@/components/ui/button';
import { SevenLogo } from '@/components/SevenLogo';
import { ProfileSwitcher } from '@/components/ProfileSwitcher';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar';

const adminCoreLinks = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { title: 'Clientes', url: '/admin/clientes', icon: Users, module: 'clientes' },
  { title: 'Contratos', url: '/admin/contratos', icon: FileSignature, module: 'contratos' },
  { title: 'Produtos', url: '/admin/produtos', icon: Sparkles, module: 'produtos' },
];

const adminOperationalLinks = [
  { title: 'Reuniões', url: '/admin/reunioes', icon: Clock, module: 'reunioes' },
  { title: 'Tarefas', url: '/admin/tarefas', icon: FileCheck, module: 'tarefas' },
  { title: 'Documentos', url: '/admin/documentos', icon: FileText, module: 'documentos' },
];

const adminConfigLinks = [
  { title: 'Usuários', url: '/admin/consultores', icon: Users, module: 'consultores' },
  { title: 'Permissões', url: '/admin/permissoes-consultores', icon: ShieldCheck, module: 'permissoes-consultores' },
  { title: 'Metas dos Consultores', url: '/admin/metas-consultores', icon: TrendingUp, module: 'metas-consultores' },
  { title: 'Integrações', url: '/admin/integracoes', icon: Plug, module: 'integracoes' },
];

const comingSoonLinks = [
  { title: 'Metodologia Seven', url: '/admin/metodologia', icon: BookOpen, module: 'metodologia' },
  { title: 'Inteligência', url: '/admin/inteligencia', icon: TrendingUp, module: 'inteligencia' },
  { title: 'Análise Avançada', url: '/admin/analise-avancada', icon: BarChart3, module: 'analise-avancada' },
  { title: 'Mapa da Carteira', url: '/admin/mapa-carteira', icon: Map, module: 'mapa-carteira' },
  { title: 'Notificações', url: '/admin/notificacoes', icon: Bell, module: 'notificacoes' },
  { title: 'Pipeline de Renovação', url: '/admin/renovacao', icon: RefreshCw, module: 'renovacao' },
  { title: 'Pipeline', url: '/admin/pipeline', icon: GitBranch, module: 'pipeline' },
  { title: 'Alertas', url: '/admin/alertas', icon: ShieldAlert, module: 'alertas' },
  { title: 'IA Analítica', url: '/admin/ia', icon: Sparkles, module: 'ia' },
  { title: 'Relacionamento', url: '/admin/relacionamento', icon: Heart, module: 'relacionamento' },
];


function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { can } = useMyPermissions();

  const filteredCore = adminCoreLinks.filter(l => can(l.module));
  const filteredOps = adminOperationalLinks.filter(l => can(l.module));
  const filteredConfig = adminConfigLinks.filter(l => can(l.module));
  const filteredSoon = comingSoonLinks.filter(l => can(l.module));

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-4 flex items-center gap-2">
          {collapsed
            ? <div className="h-8 w-8 rounded-md bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm shrink-0">7</div>
            : <SevenLogo fill="white" height={20} />
          }
        </div>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/50 px-3 mb-1">
              Administração
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredCore.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent rounded-md transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-primary before:rounded-r"
                    >
                      <item.icon className="mr-3 h-[18px] w-[18px]" strokeWidth={1.5} />
                      {!collapsed && <span className="text-[13px]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {filteredOps.length > 0 && (
                <Collapsible asChild className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="h-10">
                        <Briefcase className="mr-3 h-[18px] w-[18px]" strokeWidth={1.5} />
                        {!collapsed && (
                          <>
                            <span className="text-[13px]">Operacional</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {filteredOps.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to={item.url}
                                className="hover:text-sidebar-foreground transition-colors"
                                activeClassName="text-primary font-medium"
                              >
                                <item.icon className="mr-2 h-4 w-4" strokeWidth={1.5} />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}


              {filteredConfig.length > 0 && (
                <Collapsible asChild className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="h-10">
                        <Settings className="mr-3 h-[18px] w-[18px]" strokeWidth={1.5} />
                        {!collapsed && (
                          <>
                            <span className="text-[13px]">Configuração</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {filteredConfig.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to={item.url}
                                className="hover:text-sidebar-foreground transition-colors"
                                activeClassName="text-primary font-medium"
                              >
                                <item.icon className="mr-2 h-4 w-4" strokeWidth={1.5} />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {filteredSoon.length > 0 && (
                <Collapsible asChild className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="h-10">
                        <Rocket className="mr-3 h-[18px] w-[18px]" strokeWidth={1.5} />
                        {!collapsed && (
                          <>
                            <span className="text-[13px]">Em breve</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {filteredSoon.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to={item.url}
                                className="hover:text-sidebar-foreground transition-colors"
                                activeClassName="text-primary font-medium"
                              >
                                <item.icon className="mr-2 h-4 w-4" strokeWidth={1.5} />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="mt-auto p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <LogOut className="h-4 w-4 mr-2" strokeWidth={1.5} />
            {!collapsed && <span className="text-[13px]">Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminLayout() {
  const { user, isLoading: loadingAuth } = useAuth();
  const { can, getFirstAllowedRoute, isLoading: loadingPermissions } = useMyPermissions();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loadingAuth && !loadingPermissions) {
      if (!user) {
        navigate('/login');
        return;
      }

      // Check current route permission
      const currentPath = location.pathname;
      const matchedModule = ADMIN_MODULES_CONFIG.find(m => currentPath.startsWith(m.path));
      
      if (matchedModule && !can(matchedModule.key)) {
        const firstRoute = getFirstAllowedRoute();
        if (firstRoute) navigate(firstRoute);
      }
    }
  }, [loadingAuth, loadingPermissions, user, location.pathname, can, getFirstAllowedRoute, navigate]);

  if (loadingAuth || loadingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border/60 bg-card/80 backdrop-blur-sm flex items-center justify-between px-5 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="h-4 w-px bg-border" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Administração</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">{user?.nome}</span>
            </div>
          </header>
          <main className="flex-1 px-8 py-8 pb-16 overflow-auto">
            <div className="max-w-[1400px] mx-auto w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
