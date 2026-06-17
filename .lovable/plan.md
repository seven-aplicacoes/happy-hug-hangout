## Objetivo
Implementar o PONTO 23: nova seção global de links do OneDrive por cliente e correção da permissão de upload de documentos para consultores.

## Parte 1 — OneDrive do Cliente (links globais)

### Banco (migration)
Criar tabela `public.client_onedrive_links`:
- `id uuid pk`, `client_id uuid not null references clients(id) on delete cascade`
- `title text not null`, `url text not null`
- `category text` (pasta_principal | atas | documentos_internos | entregaveis | outros)
- `description text`, `created_by uuid references profiles(id)`
- `created_at`, `updated_at` (com trigger `update_updated_at_column`)
- GRANTs para `authenticated` e `service_role`
- RLS:
  - admin: full access (`is_admin()`)
  - consultor: SELECT/INSERT/UPDATE/DELETE se `check_consultant_client_access(client_id)`
  - cliente: sem acesso (não criar policy)

### Frontend
- Novo hook `src/hooks/useClienteOneDriveLinks.ts` (CRUD via supabase + react-query).
- Novo componente `src/components/cliente/OneDriveLinksCard.tsx`:
  - Lista de links com ícone, título, categoria, botão Abrir (novo tab, `rel="noopener noreferrer"`), Editar, Excluir.
  - Empty state com CTA "Adicionar link".
- Novo modal `src/components/modals/ModalOneDriveLink.tsx` (campos: título*, url*, categoria, observação; validação zod incluindo URL onedrive/sharepoint).
- Inserir `<OneDriveLinksCard />` em `ClienteDetalhePage.tsx`, logo após a Ficha Cadastral e antes de "Contratos e Jornada".
- Permissões na UI: botões de adicionar/editar/excluir gated por `isAdmin || can('ficha_cliente','edit')` ou permissão de documentos.

## Parte 2 — Upload de documentos para consultores

### Frontend (`src/components/contracts/ContractJourneyCard.tsx`)
- Substituir gate `mode === 'admin'` por: `isAdmin || (mode !== 'client' && can('documentos','create'))`.
- Manter botão oculto para cliente.
- Mensagem amigável quando consultor sem permissão tenta interagir.

### Backend / RLS
- Verificar policies de `documents` / `contract_module_documents` e do bucket `documents` em storage para permitir INSERT/SELECT por consultor responsável pelo cliente (usando `check_consultant_client_access`).
- Se faltar policy de upload no storage para consultor, adicionar via migration:
  - `storage.objects` INSERT/SELECT/DELETE quando bucket = 'documents' e usuário é admin OU consultor com acesso ao cliente (path encode contém client_id).

### Mensagens
- Tratar erros de upload com toast amigável ("Não foi possível enviar o arquivo..."), nunca expor erro técnico.

## Critérios de aceite
- Links OneDrive persistem no Supabase, múltiplos por cliente, abrem em nova aba.
- Consultor com permissão consegue fazer upload em Documentos Internos e Entregáveis.
- Consultor sem permissão não vê o botão.
- Estrutura existente de documentos preservada.

Posso seguir com a implementação?