Este é um melhoramento amplo da área **Operacional > Tarefas**. Abaixo está o plano dividido por arquivo e regra. Preciso da sua aprovação antes de implementar — é uma mudança grande e quero confirmar o escopo.

## 1. Abas (`ConsultorTarefasPage.tsx` e equivalente Admin)
- Remover aba **"Delegadas pelo gestor"**.
- Criar aba **"Todos"** (primeira, default).
- Resultado: `Todos | Minhas tarefas | Chamados abertos | Chamados recebidos`.
- Filtros por aba aplicados sobre o mesmo dataset vindo do hook `useTarefas`.

## 2. Cards (`TaskCard.tsx`)
- Adicionar badge no topo: **"Tarefa"** ou **"Chamado"** (cores distintas, ícone clipboard vs headset).
- Para **chamado**: remover linhas de contrato, produto, módulo, "Sem contrato vinculado", etc. Mostrar apenas: assunto, cliente, descrição resumida, aberto por, responsável, prioridade, status, data.
- Para **tarefa**: manter cliente, contrato, produto, etapa/módulo (somente quando existirem — sem placeholders "não vinculado").
- Borda lateral colorida diferenciando tipo.

## 3. Modal "Nova Demanda" (`ModalNovaTarefaChamado.tsx`)
- Aumentar largura para `max-w-3xl` (~800px) desktop; full em mobile.
- Manter seleção inicial de tipo: **Tarefa de Consultoria** ou **Abertura de Chamado**.
- Campos por tipo conforme spec.
- **Cascata sempre visível** na tarefa: Cliente → Contrato → Produto → Etapa/Módulo. Campos dependentes aparecem desde o início mas `disabled` + `opacity-40 cursor-not-allowed` + helper text ("Selecione um cliente primeiro" etc.), ativando 100% conforme dependência for preenchida.
- Chamado NÃO mostra contrato/produto/módulo.
- Salvamento no Supabase respeitando o tipo (`tasks.task_type` ou equivalente — verificar schema antes).

## 4. Modal Detalhes (`ModalDetalhesTarefa.tsx`)
- Largura `max-w-5xl` (~1000px).
- Layout em 2 colunas: esquerda (descrição, cliente, contexto), direita (operacional: criada por, responsável, status, prioridade, vencimento, criação).
- Badge **"Tarefa"** ou **"Chamado"** no topo. Remover campo técnico "Tipo".
- Chamado oculta contrato/produto/módulo.

## 5. Modal Edição (`ModalTarefa.tsx`)
- **Bloquear edição** de: cliente, contrato, produto, etapa/módulo, tipo (renderizados como readonly).
- Permitir editar: título/assunto, descrição, prazo, responsável, prioridade, status.
- Linguagem adaptada conforme tipo (labels "Título da tarefa" vs "Assunto do chamado" etc.).

## 6. Remover mocks
- Limpar usos de `Admin`, `Desconhecido`, `Sem contrato vinculado`, arrays locais em `TaskCard`, modais e página de tarefas. Tudo vem do hook Supabase.

## 7. Empty states
- "Todos" → "Nenhuma demanda encontrada."
- "Minhas tarefas" → "Nenhuma tarefa cadastrada."
- "Chamados abertos" → "Nenhum chamado aberto."
- "Chamados recebidos" → "Nenhum chamado recebido."

## Arquivos a editar
- `src/pages/consultor/ConsultorTarefasPage.tsx`
- `src/pages/admin/AdminTarefasPage.tsx` (espelhar abas se aplicável)
- `src/components/TaskCard.tsx`
- `src/components/modals/ModalNovaTarefaChamado.tsx`
- `src/components/modals/ModalDetalhesTarefa.tsx`
- `src/components/modals/ModalTarefa.tsx`
- `src/hooks/useTarefas.ts` (ajustes de filtros por aba, sem mudanças de schema)

## Detalhes técnicos
- Sem migrations — usa schema existente de `tasks`. Confirmarei colunas existentes (`task_type`, `subject`, `opened_by`, `client_id`, `contract_id`, `contract_product_id`, `contract_phase_id`, `assignee_id`, `priority`, `status`, `due_date`, `description`, `title`) antes de tocar nos saves.
- Estilo: badges via `Badge` shadcn com variantes semânticas já existentes; ícones `lucide-react` (`ClipboardList`, `Headset`).
- Cascata desabilitada usa classes Tailwind `opacity-40 pointer-events-none` no wrapper do Select.

## Riscos / pontos a confirmar com você
1. **AdminTarefasPage** também deve receber as novas abas ou só o portal do consultor? Spec menciona Painel Consultor.
2. Hoje o tipo é salvo em qual coluna? Se não houver coluna específica, preciso adicionar via migration (avisarei).
3. Para "Chamados recebidos" — definir "área dele" como `consultant_id = auth.uid()` (responsável direto) é suficiente? Não há tabela de áreas hoje.

Aprove para eu implementar, ou me diga ajustes.