# Plano de Refatoração do Dashboard Admin

## 1. Nova estrutura de dados (Hooks)
- Criar `src/hooks/admin/useAdminDashboardMetrics.ts` para consolidar todas as métricas em uma única requisição.
- Consolidar as fontes: `clients`, `contracts`, `tasks`, `meetings`, `profiles`, `client_alerts`.

## 2. Refatoração de `AdminDashboardPage.tsx`
- Remover todas as dependências de `mockData.ts`, `sevenGestaoMock.ts` e `consultorExtras.ts`.
- Alterar a busca de dados para usar `useAdminDashboardMetrics`.
- Consolidar os indicadores em objetos de estado reais.
- Implementar cálculo de dias de interação com base real (última reunião, última tarefa, data criação).
- Atualizar a lógica de "Consultores" para buscar `profiles` com `role: 'consultor'`.

## 3. Implementação de Modais de Indicadores
- Criar `AdminDashboardModals.tsx` para gerenciar os modais abertos de clientes (ex: "Em dia", "Atenção", "Crítico", "Prioridades").
- Fazer cada card de "Saúde da Carteira" abrir o modal correspondente com a lista filtrada.

## 4. Limpeza
- Remover seções `Sinais Operacionais` e `Alertas das clínicas`.
- Remover duplicidades de indicadores.
- Corrigir o bug de "20603d".

## 5. Melhorias de UX
- Adicionar estados de loading, vazio e erro.
- Otimizar filtros de consultor (opcional).
