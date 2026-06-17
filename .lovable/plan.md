## Ficha do Cliente — Jornada expandida + Criação de tarefas contextual

### Parte 1 — Contratos e Jornada expandido por padrão

**Arquivos:**
- `src/pages/ClienteDetalhePage.tsx` (linha 667): trocar `<Accordion type="single" collapsible>` por `<Accordion type="multiple" defaultValue={contratosCliente.map(c => c.id)}>` para abrir todos os contratos por padrão e permitir múltiplos abertos simultâneos.
- `src/components/contracts/ContractJourneyCard.tsx`: nos níveis internos (produtos, módulos/fases, encontros) substituir/ajustar `Accordion type="single"` por `type="multiple" defaultValue={...todos}`, e o `useState(false)` de `expanded` (linha 343) por `useState(true)`. Manter os toggles para o usuário comprimir/expandir.
- Garantir layout responsivo (sem mudanças estruturais nos estilos).

### Parte 2 — Criação e listagem de tarefas na Ficha do Cliente

**Novo componente:** `src/components/TarefasClienteSection.tsx`
- Lista tarefas reais via `useTarefas` (já existente) filtradas por `client_id = clientId`.
- Cada item exibe título, prioridade, status, prazo, responsável, vínculo (contrato/produto/módulo/encontro).
- Estado vazio amigável com botão "Criar tarefa".
- Botão "+ Nova Tarefa" no header da seção.
- Ao clicar em uma tarefa, abre `ModalDetalhesTarefa` existente.
- Ao clicar em "Nova Tarefa", abre `ModalTarefa` existente com `defaultValues` pré-preenchidos.

**Botões "+ Tarefa" contextuais em `ContractJourneyCard.tsx`:**
- Header do contrato: pré-preenche `client_id`, `contract_id`.
- Header de cada produto: + `contract_product_id`.
- Header de cada módulo/fase: + `contract_product_phase_id`.
- Linha de cada encontro: + `contract_module_meeting_id`.
- Callback `onCreateTask(context)` propagado da `ClienteDetalhePage` que abre o modal único.

**ClienteDetalhePage.tsx:**
- Botão "+ Nova Tarefa" no topo da página (área do header existente).
- Renderiza `<TarefasClienteSection clientId={id} />` como nova seção entre Ficha Cadastral e Contratos e Jornada.
- Mantém um único estado `taskModalContext` e renderiza `ModalTarefa` para criação.

**ModalTarefa.tsx (ajustes mínimos):**
- Aceitar prop opcional `defaultContext: { clientId, contractId?, contractProductId?, contractProductPhaseId?, contractModuleMeetingId? }` e popular o formulário ao abrir. Apenas estender se já não existir — verificar schema da tabela `tasks` antes para usar nomes reais de coluna.

**Hook `useTarefas`:** verificar se aceita filtro `clientId`; caso não, adicionar filtro server-side via Supabase.

**Persistência:** uso direto da tabela `tasks` existente (RLS já cobre Admin/Consultor). Nenhuma migration nova; nenhum mock.

### Critérios de aceite cobertos
- Jornada abre expandida, usuário pode comprimir.
- Tarefas reais por cliente listadas e atualizadas via React Query invalidate após criar/editar.
- Botões de criação em todos os níveis (cliente, contrato, produto, módulo, encontro).
- Reuso de `ModalTarefa` e `ModalDetalhesTarefa`. Sem mocks. Mensagens via `toast`.

### Fora do escopo
- Não alterar RLS, schema, roles.
- Não criar novo modal.
