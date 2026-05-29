import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import { LayoutDashboard, FolderKanban, TrendingUp, Users, LogOut, Menu, ShieldAlert, Map, GitBranch, BookOpen, FileText, Heart, Bell, Plug, FileSignature, Sparkles, RefreshCw, BarChart3, ShieldCheck, FileCheck, Clock, ChevronRight, Rocket, Briefcase, Activity, BarChart, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SevenLogo } from '@/components/SevenLogo';
import { ProfileSwitcher } from '@/components/ProfileSwitcher';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar';

const adminCoreLinks = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Clientes', url: '/admin/clientes', icon: Users },
  { title: 'Contratos', url: '/admin/contratos', icon: FileSignature },
  { title: 'Produtos', url: '/admin/produtos', icon: Sparkles },
];

const adminOperationalLinks = [
  { title: 'Reuniões', url: '/admin/reunioes', icon: Clock },
  { title: 'Tarefas', url: '/admin/tarefas', icon: FileCheck },
  { title: 'Documentos', url: '/admin/documentos', icon: FileText },
  { title: 'Notificações', url: '/admin/notificacoes', icon: Bell },
];

const adminIntelligenceLinks = [
  { title: 'Análise Avançada', url: '/admin/analise-avancada', icon: BarChart3 },
  { title: 'Mapa da Carteira', url: '/admin/mapa-carteira', icon: Map },
];

const adminConfigLinks = [
  { title: 'Usuários', url: '/admin/consultores', icon: Users },
  { title: 'Permissões', url: '/admin/permissoes-consultores', icon: ShieldCheck },
  { title: 'Metas dos Consultores', url: '/admin/metas-consultores', icon: TrendingUp },
  { title: 'Metodologia Seven', url: '/admin/metodologia', icon: BookOpen },
  { title: 'Integrações', url: '/admin/integracoes', icon: Plug },
];

const comingSoonLinks = [
  { title: 'Pipeline de Renovação', url: '/admin/renovacao', icon: RefreshCw },
  { title: 'Pipeline', url: '/admin/pipeline', icon: GitBranch },
  { title: 'Alertas', url: '/admin/alertas', icon: ShieldAlert },
  { title: 'Inteligência', url: '/admin/inteligencia', icon: TrendingUp },
  { title: 'IA Analítica', url: '/admin/ia', icon: Sparkles },
  { title: 'Relacionamento', url: '/admin/relacionamento', icon: Heart },
];


function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { logout } = useAuth();
  const navigate = useNavigate();

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
              {adminCoreLinks.map((item) => (
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
                      {adminOperationalLinks.map((item) => (
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

              <Collapsible asChild className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="h-10">
                      <BarChart className="mr-3 h-[18px] w-[18px]" strokeWidth={1.5} />
                      {!collapsed && (
                        <>
                          <span className="text-[13px]">Inteligência</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {adminIntelligenceLinks.map((item) => (
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
                      {adminConfigLinks.map((item) => (
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
                      {comingSoonLinks.map((item) => (
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
  const { user } = useAuth();
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
