import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useAutoMeetingStatus } from "@/hooks/useAutoMeetingStatus";

import LoginPage from "@/pages/LoginPage";
import SelecionarAmbientePage from "@/pages/SelecionarAmbientePage";
import AdminLayout from "@/layouts/AdminLayout";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";

import AdminClientesPage from "@/pages/admin/AdminClientesPage";
import NovoClientePage from "@/pages/admin/NovoClientePage";
import AdminConsultoresPage from "@/pages/admin/AdminConsultoresPage";
import AdminConsultorDetalhePage from "@/pages/admin/AdminConsultorDetalhePage";
import AdminInteligenciaPage from "@/pages/admin/AdminInteligenciaPage";
import AdminAlertasPage from "@/pages/admin/AdminAlertasPage";
import AdminMapaCarteiraPage from "@/pages/admin/AdminMapaCarteiraPage";
import AdminPipelinePage from "@/pages/admin/AdminPipelinePage";
import AdminContratosPage from "@/pages/admin/AdminContratosPage";
import AdminIAPage from "@/pages/admin/AdminIAPage";
import AdminProdutosPage from "@/pages/admin/AdminProdutosPage";
import AdminRenovacaoPage from "@/pages/admin/AdminRenovacaoPage";
import AdminAnaliseAvancadaPage from "@/pages/admin/AdminAnaliseAvancadaPage";
import AdminConsultantPermissionsPage from "@/pages/admin/ConsultantPermissionsPage";
import AdminConsultantGoalsPage from "@/pages/admin/AdminConsultantGoalsPage";
import AdminTarefasPage from "@/pages/admin/AdminTarefasPage";
import AdminReunioesPage from "@/pages/admin/AdminReunioesPage";
import AdminContratoDetalhePage from "@/pages/admin/AdminContratoDetalhePage";
import ConsultorLayout from "@/layouts/ConsultorLayout";
import ConsultorDashboardPage from "@/pages/consultor/ConsultorDashboardPage";
import ConsultorClientesPage from "@/pages/consultor/ConsultorClientesPage";
import ConsultorReunioesPage from "@/pages/consultor/ConsultorReunioesPage";
import ConsultorTarefasPage from "@/pages/consultor/ConsultorTarefasPage";
import ConsultorMeuPerfilPage from "@/pages/consultor/ConsultorMeuPerfilPage";
import ConsultorRenovacaoPage from "@/pages/consultor/ConsultorRenovacaoPage";
import ClienteDetalhePage from "@/pages/ClienteDetalhePage";
import MetodologiaPage from "@/pages/MetodologiaPage";
import DocumentosPage from "@/pages/DocumentosPage";
import AdminRelacionamentoPage from "@/pages/admin/AdminRelacionamentoPage";
import AdminNotificacoesPage from "@/pages/admin/AdminNotificacoesPage";
import PortalClientePage from "@/pages/PortalClientePage";
import IntegracoesPage from "@/pages/IntegracoesPage";
import NotFound from "@/pages/NotFound";
import NoAccess from "@/pages/NoAccess";
import { ComingSoonPageWrapper } from "@/components/ComingSoonPageWrapper";


const queryClient = new QueryClient();

// Redireciona a rota raiz ou login para o dashboard adequado se autenticado
const RootRedirect = ({ children }: { children?: React.ReactNode }) => {
  const { user, perfil, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando portal...</span>
      </div>
    );
  }

  if (user) {
    const isPortalRoute = window.location.pathname.startsWith('/portal');
    
    if (perfil === 'cliente' && !isPortalRoute) {
      return <Navigate to="/portal" replace />;
    }
    
    if (perfil !== 'cliente' && isPortalRoute) {
      const target = perfil === 'admin' ? '/admin/dashboard' : '/consultor/dashboard';
      return <Navigate to={target} replace />;
    }

    if (!isPortalRoute || (perfil === 'cliente' && isPortalRoute)) {
      const target = perfil === 'admin' ? '/admin/dashboard' : (perfil === 'consultor' ? '/consultor/dashboard' : '/portal');
      // Só redireciona se estiver na raiz ou no login
      if (window.location.pathname === '/' || window.location.pathname === '/login') {
        return <Navigate to={target} replace />;
      }
    }
  }

  return children ? <>{children}</> : (window.location.pathname === '/login' ? <LoginPage /> : <Navigate to="/login" replace />);
};

// Redireciona /cliente/:id para a versão do layout adequado ao perfil ativo
const ClienteRedirect = () => {
  const { id } = useParams();
  const { perfil } = useAuth();
  const target = perfil === 'consultor' ? `/consultor/cliente/${id}` : `/admin/cliente/${id}`;
  return <Navigate to={target} replace />;
};

const AppContent = () => {
  useAutoMeetingStatus();
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
             <Route path="/login" element={<RootRedirect><LoginPage /></RootRedirect>} />
             <Route path="/selecionar-ambiente" element={<Navigate to="/admin/dashboard" replace />} />
             <Route path="/no-access" element={<NoAccess />} />
            <Route path="/portal" element={<RootRedirect><PortalClientePage /></RootRedirect>} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="clientes" element={<AdminClientesPage />} />
              <Route path="cliente/novo" element={<NovoClientePage />} />
              <Route path="produtos" element={<AdminProdutosPage />} />
              <Route path="produtos-contratados" element={<Navigate to="/admin/clientes" replace />} />
              <Route path="contratos" element={<AdminContratosPage />} />
              <Route path="renovacao" element={<ComingSoonPageWrapper><AdminRenovacaoPage /></ComingSoonPageWrapper>} />
              <Route path="ia" element={<ComingSoonPageWrapper><AdminIAPage /></ComingSoonPageWrapper>} />
              <Route path="inteligencia" element={<ComingSoonPageWrapper><AdminInteligenciaPage /></ComingSoonPageWrapper>} />
              <Route path="analise-avancada" element={<ComingSoonPageWrapper><AdminAnaliseAvancadaPage /></ComingSoonPageWrapper>} />
              <Route path="alertas" element={<ComingSoonPageWrapper><AdminAlertasPage /></ComingSoonPageWrapper>} />
              <Route path="mapa-carteira" element={<ComingSoonPageWrapper><AdminMapaCarteiraPage /></ComingSoonPageWrapper>} />
              <Route path="pipeline" element={<ComingSoonPageWrapper><AdminPipelinePage /></ComingSoonPageWrapper>} />
              <Route path="consultores" element={<AdminConsultoresPage />} />
               <Route path="consultores/:id" element={<AdminConsultorDetalhePage />} />
               <Route path="permissoes-consultores" element={<AdminConsultantPermissionsPage />} />
               <Route path="metas-consultores" element={<AdminConsultantGoalsPage />} />
              <Route path="contratos/:id" element={<AdminContratoDetalhePage />} />
              <Route path="cliente/:id" element={<ClienteDetalhePage />} />
              <Route path="metodologia" element={<ComingSoonPageWrapper><MetodologiaPage /></ComingSoonPageWrapper>} />
              <Route path="documentos" element={<DocumentosPage />} />
              <Route path="relacionamento" element={<ComingSoonPageWrapper><AdminRelacionamentoPage /></ComingSoonPageWrapper>} />
              <Route path="notificacoes" element={<ComingSoonPageWrapper><AdminNotificacoesPage /></ComingSoonPageWrapper>} />
              <Route path="tarefas" element={<AdminTarefasPage />} />
              <Route path="reunioes" element={<AdminReunioesPage />} />
              <Route path="integracoes" element={<IntegracoesPage />} />
            </Route>

            <Route path="/consultor" element={<ConsultorLayout />}>
              <Route path="dashboard" element={<ConsultorDashboardPage />} />
               <Route path="clientes" element={<ConsultorClientesPage />} />
               <Route path="cliente/novo" element={<NovoClientePage />} />
              <Route path="reunioes" element={<ConsultorReunioesPage />} />
              <Route path="tarefas" element={<ConsultorTarefasPage />} />
              <Route path="renovacao" element={<ComingSoonPageWrapper><ConsultorRenovacaoPage /></ComingSoonPageWrapper>} />
              <Route path="meu-perfil" element={<ConsultorMeuPerfilPage />} />
              <Route path="cliente/:id" element={<ClienteDetalhePage />} />
              <Route path="metodologia" element={<ComingSoonPageWrapper><MetodologiaPage /></ComingSoonPageWrapper>} />
              <Route path="documentos" element={<DocumentosPage />} />
              <Route path="integracoes" element={<IntegracoesPage />} />
            </Route>

            {/* Alias legado: redireciona para a rota do perfil ativo */}
            <Route path="/cliente/:id" element={<ClienteRedirect />} />


            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
