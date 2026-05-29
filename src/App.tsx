import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

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


const queryClient = new QueryClient();

// Redireciona /cliente/:id para a versão do layout adequado ao perfil ativo
const ClienteRedirect = () => {
  const { id } = useParams();
  const { perfil } = useAuth();
  const target = perfil === 'consultor' ? `/consultor/cliente/${id}` : `/admin/cliente/${id}`;
  return <Navigate to={target} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
             <Route path="/login" element={<LoginPage />} />
             <Route path="/selecionar-ambiente" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/portal" element={<PortalClientePage />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="clientes" element={<AdminClientesPage />} />
              <Route path="cliente/novo" element={<NovoClientePage />} />
              <Route path="produtos" element={<AdminProdutosPage />} />
              <Route path="produtos-contratados" element={<Navigate to="/admin/clientes" replace />} />
              <Route path="contratos" element={<AdminContratosPage />} />
              <Route path="renovacao" element={<AdminRenovacaoPage />} />
              <Route path="ia" element={<AdminIAPage />} />
              <Route path="inteligencia" element={<AdminInteligenciaPage />} />
              <Route path="analise-avancada" element={<AdminAnaliseAvancadaPage />} />
              <Route path="alertas" element={<AdminAlertasPage />} />
              <Route path="mapa-carteira" element={<AdminMapaCarteiraPage />} />
              <Route path="pipeline" element={<AdminPipelinePage />} />
              <Route path="consultores" element={<AdminConsultoresPage />} />
               <Route path="consultores/:id" element={<AdminConsultorDetalhePage />} />
               <Route path="permissoes-consultores" element={<AdminConsultantPermissionsPage />} />
              <Route path="contratos/:id" element={<AdminContratoDetalhePage />} />
              <Route path="cliente/:id" element={<ClienteDetalhePage />} />
              <Route path="metodologia" element={<MetodologiaPage />} />
              <Route path="documentos" element={<DocumentosPage />} />
              <Route path="relacionamento" element={<AdminRelacionamentoPage />} />
              <Route path="notificacoes" element={<AdminNotificacoesPage />} />
              <Route path="tarefas" element={<AdminTarefasPage />} />
              <Route path="reunioes" element={<AdminReunioesPage />} />
              <Route path="integracoes" element={<IntegracoesPage />} />
            </Route>

            <Route path="/consultor" element={<ConsultorLayout />}>
              <Route path="dashboard" element={<ConsultorDashboardPage />} />
              <Route path="clientes" element={<ConsultorClientesPage />} />
              <Route path="reunioes" element={<ConsultorReunioesPage />} />
              <Route path="tarefas" element={<ConsultorTarefasPage />} />
              <Route path="renovacao" element={<ConsultorRenovacaoPage />} />
              <Route path="meu-perfil" element={<ConsultorMeuPerfilPage />} />
              <Route path="cliente/:id" element={<ClienteDetalhePage />} />
              <Route path="metodologia" element={<MetodologiaPage />} />
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
  </QueryClientProvider>
);

export default App;
