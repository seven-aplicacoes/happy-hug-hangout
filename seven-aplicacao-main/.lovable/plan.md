# PARTE 2 — Perfil Administrador (auditoria + complementos)

Roadmap longo. Vou implementar em **6 commits lógicos**, sempre auditando antes (sem recriar o que já existe). Abaixo o que **já existe**, o que será **ajustado** e o que será **criado**.

---

## Auditoria — o que já existe e será mantido

- **Contratos**: `AdminProjetosPage` (tabela com 9 status, filtros, engajamento, fase), `contratoExtras` (produto/histórico/ticket), 9 estados de `StatusContrato`.
- **Consultores**: `AdminConsultoresPage` (lista + risco), `AdminConsultorDetalhePage`, `consultorExtras` (capacidade 50-150h, ocupação, sobrecarga).
- **Clientes**: `ClienteDetalhePage` com Blocos 1–5 (timeline, indicadores, decisões, plano de sucesso, valor percebido, avaliação IA), `clienteIndicadores`, `clienteExtras` (porte, região, especialidade).
- **Inteligência**: `AdminInteligenciaPage` (faturamento, distribuição, risco).
- **IA**: `iaInsights.ts` + `IaInsightCard` (churn, cross-sell, renovação, rebalanceamento, upsell) já no Dashboard.
- **Gestor/CS**: `AdminMapaCarteiraPage`, `AdminPipelinePage`, `AdminAlertasPage`.

---

## Bloco 1 — Gestão de Contratos (nova página `/admin/contratos`)

Hoje só temos a listagem operacional (`/admin/projetos`). Vou criar **`AdminContratosPage`** focada em **gestão estratégica de contratos**:

- KPIs: total / ativos / novos no mês (filtro mês).
- Distribuição por status (donut com 9 estados).
- **Análise por tempo de contrato** — barras com faixas 0-3, 3-6, 6-9, 9-12, 12-15, 15-36m, com drill-down lateral (lista de clientes da faixa).
- **Segmentação por produto** — produto atual + histórico (reaproveita `contratoExtras`).
- **Indicadores estratégicos**: churn, renovação, reativação, novos, ticket médio, LTV por coorte (cálculo a partir de `contratos`).
- **Indicadores de execução**: índice de atraso, planejado vs realizado (deriva de `clienteIndicadores`).
- **Alertas automáticos** (componente reutilizado de Alertas): 1º mês sem evolução, 60d do fim, fim sem renovação, atraso crítico, suspensos.

Novos arquivos: `src/data/contratosAnalytics.ts`, `src/pages/admin/AdminContratosPage.tsx`.

---

## Bloco 2 — Gestão de Consultores (evolução da página atual)

Manter `AdminConsultoresPage`, adicionar uma seção superior **"Capacidade Operacional"**:

- 4 KPIs: capacidade total agregada, utilizada, % ocupação, consultores em sobrecarga.
- **Gráfico Capacidade × Utilização** por consultor (barras agrupadas).
- **Alertas inteligentes de capacidade**: <50h subutilização, >90h risco qualidade, >40h/sem sobrecarga, cliente consumindo >50% horas em <50% do tempo.
- Card **Balanceamento da carteira** com sugestão de realocação (já existe parcialmente em `iaInsights`, reaproveitar).

Novo: `src/components/CapacidadeChart.tsx`; edita `AdminConsultoresPage.tsx` e amplia `consultorExtras.ts` com `alertasCapacidade()`.

---

## Bloco 3 — Gestão de Clientes (complementos)

A ficha do cliente já está rica. Auditoria identifica 2 lacunas:

- **Score de risco 0-100 + Score de engajamento + Score de evolução + CSAT** consolidados num card "Saúde do Cliente". Hoje temos engajamento qualitativo e Índice Seven; criar `clienteScores.ts` derivando scores 0-100 a partir de dados existentes (reuniões, atrasos, NPS).
- **Timeline de mudanças de status** + flag de reativação + mudança de plano — adicionar aba/seção em `ClienteDetalhePage` reaproveitando `TimelineCard`.
- **Entregáveis por fase** — já parcial em `metodologia.ts`; complementar com `entregaveisPorFase.ts` (escopos pré-carregados por produto, micro-fases, planejado vs realizado).
- **Análise crítica de churn** — card em `AdminContratosPage`: por que, quando, com qual consultor.

Novos: `src/data/clienteScores.ts`, `src/data/entregaveisPorFase.ts`, `src/components/SaudeClienteCard.tsx`.

---

## Bloco 4 — Inteligência Estratégica (evolução de `AdminInteligenciaPage`)

Adicionar seções:

- **Análise por Fase do Contrato** (0-3, 3-6, 6-12, +12m) — clientes por fase + risco.
- **Análise por Produto** (jornada, gargalos, upsell).
- **Churn por perfil** (porte / região / especialidade / consultor) — heatmap simples.
- **Tempo médio até cancelamento / reativação** — KPIs.
- **LTV por coorte** + **Distribuição da base por fase** (reaproveita base de `contratosAnalytics`).

Edita `AdminInteligenciaPage.tsx`; novo `src/data/inteligenciaAvancada.ts`.

---

## Bloco 5 — Camada de IA (evolução de `iaInsights`)

- Ampliar `iaInsights.ts` para incluir **anomalias** (consultor com queda de performance, padrão regional de churn) e **oportunidades** (cliente próximo de marco de upsell).
- Criar **nova página `/admin/ia`** (`AdminIAPage`) com:
  - **Relatório semanal executivo** (cards: riscos da semana, oportunidades, números-chave).
  - **Recomendações por perfil** (Gestor de Projetos / Sucesso / Diretor de Operações).
  - Listagem completa de insights (hoje só os top no Dashboard).
- Link no sidebar admin.

Novos: `src/data/relatorioSemanalIA.ts`, `src/pages/admin/AdminIAPage.tsx`.

---

## Bloco 6 — Visão Gestor de Projetos & CS (consolidação)

Já temos `AdminMapaCarteiraPage` e `AdminPipelinePage`. Auditoria:

- **Mapa da carteira por fase** ✅ já existe — complementar com priorização visual (cor por risco).
- **Gargalos da jornada** — adicionar seção "Etapas com mais clientes parados há +X dias" em `AdminMapaCarteiraPage`.
- **Drill-down de travamentos** — sidebar ao clicar em fase, mostrando entregável travado e tempo.
- **Mapa de Risco** (cruzamento risco × fase × tempo sem interação) — novo card/matriz.
- **Pipeline Kanban da jornada por cliente** ✅ existe em `AdminPipelinePage` — complementar com responsáveis e ações.

Edita `AdminMapaCarteiraPage.tsx` e `AdminPipelinePage.tsx`; novo `src/components/MapaRiscoMatriz.tsx`.

---

## Regras gerais aplicadas

- **"Execução" → "Estruturação"**: já está padronizado no projeto (`FaseMetodologica = 'estruturacao'`); farei busca global para garantir.
- Estados vazios, loading e fallback em todas as novas páginas.
- Responsividade (grid colapsa para mobile).
- Tooltips e legendas em todo score/indicador novo.
- Alertas sempre com **motivo + nível + próxima ação**.
- Tudo com mock determinístico pronto para conexão real.

---

## Rotas/telas impactadas

| Rota | Ação |
| --- | --- |
| `/admin/contratos` | **nova** |
| `/admin/ia` | **nova** |
| `/admin/consultores` | ampliada (capacidade) |
| `/admin/inteligencia` | ampliada (fase, churn, LTV) |
| `/admin/mapa-carteira` | ampliada (gargalos, mapa de risco) |
| `/admin/pipeline` | ampliada (responsáveis/ações) |
| `/cliente/:id` | ampliada (saúde + entregáveis + timeline status) |

## Componentes novos

`SaudeClienteCard`, `CapacidadeChart`, `MapaRiscoMatriz`, `RelatorioSemanalCard`, `DrillDownPanel`.

## Pendências para backend real

- Cálculo de LTV por coorte e churn por perfil requer histórico real de contratos.
- Recomendações da IA hoje são heurísticas determinísticas; conectar a modelo real (Lovable AI Gateway) é trivial via edge function.
- Notificações automáticas de alerta (já estruturadas em `notificacoesReuniao.ts`) precisam de scheduler.

Confirma para eu seguir?
