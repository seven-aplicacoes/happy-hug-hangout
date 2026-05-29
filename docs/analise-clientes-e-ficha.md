# Diagnóstico Técnico: Aba Clientes e Ficha do Cliente

Este documento apresenta uma análise detalhada da implementação atual dos módulos de Clientes (Admin e Consultor) e da Ficha do Cliente, mapeando o que está conectado ao Supabase, o que utiliza dados mockados e o que falta para a operacionalização total.

---

## 1. Mapeamento do Frontend

A área de clientes está dividida em três frentes principais:

### Admin > Gestão de Clientes
- **Rota:** `/admin/clientes`
- **Arquivo:** `src/pages/admin/AdminClientesPage.tsx`
- **Componentes:** `DataTable`, `FilterBar`, `ModalNovoCliente`, `ModalAcessoPortal`.
- **Campos exibidos:** Nome Fantasia/Razão Social, CNPJ, Porte, Consultor Responsável, Status, Acesso ao Portal, Índice Seven.
- **Ações:** Criar novo cliente, Editar (abre Ficha), Excluir, Liberar Acesso ao Portal, Filtrar (Status, Porte, Consultor), Buscar.
- **Origem dos Dados:** `useClientes` hook (conectado ao Supabase).

### Consultor > Meus Clientes
- **Rota:** `/consultor/clientes`
- **Arquivo:** `src/pages/consultor/ConsultorClientesPage.tsx`
- **Campos exibidos:** Nome Fantasia, Objetivo Atual, Prioridade (calculada), Produto, Porte, Status, Fase Metodológica, Engajamento, Índice Seven, Dias sem Reunião.
- **Destaque:** Gráficos de Composição da Carteira (Fases e Produtos).
- **Origem dos Dados:** `useClientes` (Supabase) + Lógica determinística de indicadores em `src/data/`.

### Ficha do Cliente (Central Operacional)
- **Rota:** `/admin/cliente/:id` ou `/consultor/cliente/:id`
- **Arquivo:** `src/pages/ClienteDetalhePage.tsx`
- **Estrutura:**
    - **Cabeçalho:** Dados principais, Fase Metodológica (Stepper), Próxima Ação.
    - **Resumo Executivo:** Objetivo, Últimas Decisões, Próximos Passos.
    - **Abas:**
        1. **Resumo:** Visão 360º.
        2. **Metodologia:** Fases e entregáveis (Stepper detalhado).
        3. **Demandas:** Tarefas e Chamados.
        4. **Reuniões:** Histórico e agendamento.
        5. **Linha do Tempo:** Histórico de eventos e IA summaries.
        6. **Documentos:** Repositório de arquivos.
        7. **Saúde Operacional:** Integração com Seven Gestão.
        8. **Contrato & KPIs:** Dados financeiros e indicadores.
        9. **Projetos:** Gestão de projetos vinculados.

---

## 2. Identificação de Dados Mockados

Apesar da conexão com o banco existir, há uma forte dependência de mocks determinísticos em arquivos de suporte:

| Arquivo | Dado Mockado | Impacto | Tabela Supabase Correta |
|---------|--------------|---------|-------------------------|
| `src/data/mockData.ts` | `consultores`, `clientes`, `reunioes`, `tarefas` | Base de dados fake usada como fallback ou em cálculos. | `profiles`, `clients`, `meetings`, `tasks` |
| `src/data/contratoExtras.ts` | Produtos, Alertas de Contrato, LTV, KPIs | O cálculo de produto e alertas ignora o banco e usa lógica baseada em hash do ID. | `contracts`, `products` |
| `src/data/clienteExtras.ts` | Datas-Chave, Consumo de Horas, CSAT, Evolução | As datas e horas consumidas são geradas por funções matemáticas, não pelos dados reais de reuniões. | `meetings`, `client_indicators` |
| `src/data/clienteIndicadores.ts` | Dores, Fatores de Sucesso, Objetivos, Prioridade | Parte dessa lógica já lê do banco, mas muitos campos são gerados aleatoriamente se estiverem vazios. | `clients` |
| `src/data/sevenGestaoMock.ts` | Faturamento Clínicas, Módulos Seven, Alertas Operacionais | **100% Mockado**. Representa o sistema externo (Seven Gestão). | N/A (Integração externa) |
| `src/data/entregaveisPorFase.ts` | Escopo de entregáveis, microfases, prazos | Gerado via código, não persiste status real de entregáveis por cliente. | `tasks` ou `deliverables` |
| `ClienteDetalhePage.tsx` | `metodologiaFases`, `chamados` | O estado de fases da metodologia e os chamados de suporte são estáticos. | `projects`, `tasks` |

---

## 3. Mapeamento do Banco de Dados (Supabase)

### Tabelas Relacionadas

1. **`clients`**: Tabela principal.
    - **Status:** OK, conectada.
    - **Campos-chave:** `corporate_name`, `trade_name`, `cnpj`, `consultant_id`, `methodology_phase`, `status`, `company_size`, `pains`, `success_factors`, `current_objective`.
2. **`contracts`**: Contratos financeiros e vigência.
    - **Status:** OK, conectada via `useClienteContratos`.
3. **`meetings`**: Reuniões e Atas.
    - **Status:** OK, conectada via `useClienteReunioes`.
4. **`tasks`**: Tarefas e Demandas.
    - **Status:** OK, conectada via `useClienteTarefas`.
5. **`documents`**: Arquivos e Documentos.
    - **Status:** OK, conectada via `useClienteDocumentos`.
6. **`timeline_events`**: Histórico da Linha do Tempo.
    - **Status:** OK, conectada via `useClienteHistorico`.
7. **`client_alerts`**: Alertas de gestão.
    - **Status:** OK, conectada via `useClienteAlertas`.
8. **`client_indicators`**: KPIs históricos.
    - **Status:** OK, conectada via `useClienteIndicadores`.
9. **`projects`**: Projetos específicos.
    - **Status:** OK, conectada via `useClienteProjetos`.
10. **`consultant_permissions`**: Regras de acesso.
    - **Status:** OK, funcional.

---

## 4. Comparativo Frontend x Banco

| Campo na Tela | Origem Atual | Tabela Supabase | Coluna Correta | Status |
|---------------|--------------|-----------------|----------------|--------|
| Nome/CNPJ | Supabase | `clients` | `trade_name` / `cnpj` | OK |
| Consultor | Supabase | `profiles` | `full_name` | OK |
| Fase Metodológica | Supabase | `clients` | `methodology_phase` | OK |
| Porte Empresa | Parcial (Mock/Cálculo) | `clients` | `company_size` | Corrigir lógica |
| Engajamento | **Mock** | N/A | Cálculo baseado em `meetings` | **Crítico** |
| Índice Seven | Supabase | `clients` | `seven_index` | OK |
| Alertas | Supabase | `client_alerts` | Várias | OK |
| Contratos | Supabase | `contracts` | Várias | OK |
| Reuniões (Histórico) | Supabase | `meetings` | Várias | OK |
| Reuniões (Consumo Horas) | **Mock** | `meetings` | Sum(`duration`) | **Crítico** |
| Entregáveis de Fase | **Mock** | `tasks` | Várias | **Crítico** |
| Dores/Objetivos | Supabase | `clients` | `pains`, `current_objective` | OK |

---

## 5. Mapeamento de Ações e CRUD

| Ação | Frontend | Conectado? | Funciona 100%? | Tabela Destino |
|------|----------|------------|----------------|---------------|
| Criar Cliente | Sim | Sim | Sim | `clients` |
| Editar Cliente | Sim | Sim | Sim | `clients` |
| Excluir Cliente | Sim | Sim | Sim | `clients` |
| Alterar Status | Sim | Sim | Sim | `clients` |
| Alterar Fase | Sim | Parcial (Local) | Não persiste fase real | `clients` |
| Criar Reunião | Sim | Sim | Sim | `meetings` |
| Registrar Ata | Sim | Sim | Sim | `meetings` |
| Criar Tarefa | Sim | Sim | Sim | `tasks` |
| Anexar Documento | Sim | Sim | Sim | `documents` |
| Resolver Alerta | Sim | Sim | Sim | `client_alerts` |
| Atualizar Indicador | Não | Não | Não | `client_indicators` |

---

## 6. Permissões Atuais

- **Admin:** Visão total, pode criar, editar, excluir e trocar consultores em qualquer cliente.
- **Consultor:** Vê apenas clientes onde `consultant_id` é o seu ID. Pode criar reuniões e tarefas. A edição da ficha depende de permissão específica em `consultant_permissions` (módulo `ficha_cliente`).
- **RLS:** Aplicado no Supabase para garantir que consultores não acessem dados de clientes de terceiros via API.

---

## 7. Problemas Técnicos Identificados

1. **Dependência de Lógica Determinística**: Arquivos em `src/data/` usam hashes de ID para "inventar" dados de CSAT, horas e alertas. Isso causa confusão pois os dados parecem reais mas não mudam quando o consultor insere uma reunião real.
2. **Desconexão de Entregáveis**: A aba de Metodologia não está vinculada a tarefas reais do banco, sendo apenas visual.
3. **KPIs Estáticos**: O resumo de "Consumo de Horas" e "Ticket Médio" não reflete os contratos e reuniões salvos no banco.
4. **Chamados Mockados**: A funcionalidade de Chamados ainda usa um array fixo em `mockData.ts`.
5. **Timeline de IA**: A integração com IA para sumarizar a timeline está pronta no frontend mas depende de processamento real para gerar os campos `ia_summary`.

---

## 8. Plano de Execução Recomendado (Ordem Ideal)

1. **Substituição dos Helpers de Dados**: Refatorar `contratoExtras.ts` e `clienteExtras.ts` para aceitar dados reais (arrays de contratos/reunioes vindos dos hooks) em vez de ler de `mockData.ts`.
2. **Vínculo Metodologia x Tarefas**: Criar um mapeamento onde os entregáveis da metodologia sejam buscados na tabela `tasks` filtrando por `methodology_phase_id`.
3. **Cálculos Reais de Saúde**: Atualizar os indicadores de engajamento e consumo de horas para usarem o agregador real de `meetings` e `contracts`.
4. **Persistência de Fases**: Garantir que a troca de fase no Stepper atualize a coluna `methodology_phase` na tabela `clients`.
5. **Migração de Chamados**: Criar a tabela `support_tickets` ou usar a tabela `tasks` com um tipo específico para substituir o mock de chamados.
6. **Limpeza de `mockData.ts`**: Remover gradualmente as exportações de dados fixos à medida que o sistema se estabiliza com dados reais.

---
*Análise concluída em 28/05/2026.*
