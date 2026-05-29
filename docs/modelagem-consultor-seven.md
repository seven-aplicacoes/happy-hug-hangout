# Análise Técnica — Visão do Consultor

Este documento descreve a modelagem de dados necessária para suportar as funcionalidades da visão do Consultor na Plataforma SEVEN, considerando o escopo de MVP e integração com Supabase.

## 1. Dashboard do Consultor
O dashboard centraliza os indicadores de performance do consultor e alertas críticos da sua carteira.

### Tabelas necessárias

| Tabela | Campo | Tipo | Exemplo | Obrigatório | Observação |
|---|---|---|---|---|---|
| consultant_metrics | id | uuid | "met_001" | Sim | Identificador único |
| consultant_metrics | consultant_id | uuid | "usr_001" | Sim | Consultor dono dos dados |
| consultant_metrics | period_start | date | "2026-05-01" | Sim | Início do período da métrica |
| consultant_metrics | period_end | date | "2026-05-31" | Sim | Fim do período |
| consultant_metrics | meetings_count | integer | 12 | Sim | Reuniões realizadas |
| consultant_metrics | csat_average | decimal | 4.8 | Não | Nota média CSAT (1-5) |
| consultant_metrics | csat_response_rate | decimal | 85.0 | Não | % de respostas CSAT |
| consultant_metrics | nps_score | integer | 72 | Não | NPS da carteira no período |
| consultant_metrics | meetings_per_client | decimal | 3.2 | Não | Média de encontros por cliente |
| consultant_metrics | updated_at | timestamp | now() | Sim | Última atualização |

**Status MVP:** Indicadores básicos (reuniões, clientes) são reais. NPS e CSAT avançado podem ser Beta dependendo da coleta de feedback.

---

## 2. Clientes do Consultor
Gestão da carteira vinculada, incluindo saúde (engajamento) e priorização.

### Tabelas necessárias

| Tabela | Campo | Tipo | Exemplo | Obrigatório | Observação |
|---|---|---|---|---|---|
| clients | id | uuid | "cli_001" | Sim | PK |
| clients | company_name | varchar | "Seven Tech LTDA" | Sim | Razão Social |
| clients | trade_name | varchar | "Seven" | Sim | Nome Fantasia |
| clients | document | varchar | "12.345.678/0001-90" | Sim | CNPJ/CPF |
| clients | status | enum | "ativo" | Sim | ativo, em_onboarding, churn, etc. |
| clients | current_phase_id | uuid | "phase_001" | Sim | Fase atual na metodologia |
| clients | size | enum | "medio" | Sim | pequeno, medio, grande |
| clients | created_at | timestamp | now() | Sim | |

| Tabela | Campo | Tipo | Exemplo | Obrigatório | Observação |
|---|---|---|---|---|---|
| consultant_clients | id | uuid | "cc_001" | Sim | PK |
| consultant_clients | consultant_id | uuid | "usr_001" | Sim | FK users |
| consultant_clients | client_id | uuid | "cli_001" | Sim | FK clients |
| consultant_clients | is_primary | boolean | true | Sim | Consultor principal? |

| Tabela | Campo | Tipo | Exemplo | Obrigatório | Observação |
|---|---|---|---|---|---|
| client_products | id | uuid | "cp_001" | Sim | PK |
| client_products | client_id | uuid | "cli_001" | Sim | FK clients |
| client_products | product_id | uuid | "prod_001" | Sim | FK methodology_products |
| client_products | start_date | date | "2026-01-01" | Sim | |
| client_products | end_date | date | "2027-01-01" | Sim | |

---

## 3. Reuniões
Controle de agenda, sincronização externa e registro de pautas.

### Tabelas necessárias

| Tabela | Campo | Tipo | Exemplo | Obrigatório | Observação |
|---|---|---|---|---|---|
| meetings | id | uuid | "mt_001" | Sim | PK |
| meetings | consultant_id | uuid | "usr_001" | Sim | FK users |
| meetings | client_id | uuid | "cli_001" | Sim | FK clients |
| meetings | title | varchar | "Reunião de Diagnóstico" | Sim | |
| meetings | description | text | "Pauta: análise de custos" | Não | |
| meetings | meeting_date | date | "2026-05-27" | Sim | |
| meetings | start_time | time | "14:00" | Sim | |
| meetings | duration_minutes | integer | 60 | Sim | |
| meetings | status | enum | "agendada" | Sim | agendada, realizada, cancelada |
| meetings | source | enum | "manual" | Sim | manual, calendly, google |
| meetings | external_id | varchar | "ev_123" | Não | ID no Google/Calendly |
| meetings | meeting_link | varchar | "zoom.us/j/123" | Não | |

---

## 4. Tarefas
Gestão de fluxo de trabalho (Kanban) e impedimentos.

### Tabelas necessárias

| Tabela | Campo | Tipo | Exemplo | Obrigatório | Observação |
|---|---|---|---|---|---|
| tasks | id | uuid | "tk_001" | Sim | PK |
| tasks | consultant_id | uuid | "usr_001" | Sim | Responsável |
| tasks | client_id | uuid | "cli_001" | Não | FK clients |
| tasks | title | varchar | "Enviar proposta de renovação" | Sim | |
| tasks | status | enum | "a_fazer" | Sim | a_fazer, em_andamento, impedida, concluida |
| tasks | priority | enum | "alta" | Sim | baixa, media, alta, critica |
| tasks | due_date | timestamp | "2026-06-01" | Não | |
| tasks | origin | enum | "manual" | Sim | manual, gestor, sistema |
| tasks | block_reason | text | "Aguardando aprovação do financeiro" | Não | Se status = impedida |

---

## 5. Documentos
Repositório de entregáveis e histórico de feedbacks.

### Tabelas necessárias

| Tabela | Campo | Tipo | Exemplo | Obrigatório | Observação |
|---|---|---|---|---|---|
| documents | id | uuid | "doc_001" | Sim | PK |
| documents | client_id | uuid | "cli_001" | Sim | FK clients |
| documents | uploader_id | uuid | "usr_001" | Sim | FK users |
| documents | title | varchar | "Diagnóstico Financeiro V1" | Sim | |
| documents | file_url | varchar | "storage/docs/001.pdf" | Sim | URL no Supabase Storage |
| documents | type | enum | "entrega" | Sim | entrega, ata, contrato |
| documents | status | enum | "pendente" | Sim | pendente, aprovado, nao_conforme |
| documents | visibility | enum | "publico" | Sim | publico (cliente vê), privado |

---

## 6. Metodologia Seven
Conteúdo base da consultoria organizado por fases e produtos.

### Tabelas necessárias

| Tabela | Campo | Tipo | Exemplo | Obrigatório | Observação |
|---|---|---|---|---|---|
| methodology_products | id | uuid | "prod_001" | Sim | PK |
| methodology_products | name | varchar | "Seven Core" | Sim | |

| Tabela | Campo | Tipo | Exemplo | Obrigatório | Observação |
|---|---|---|---|---|---|
| methodology_phases | id | uuid | "ph_001" | Sim | PK |
| methodology_phases | product_id | uuid | "prod_001" | Sim | FK products |
| methodology_phases | order_index | integer | 1 | Sim | Ordem da fase (1 a 5) |
| methodology_phases | name | varchar | "Diagnóstico" | Sim | |
| methodology_phases | purpose | text | "Entender a situação atual" | Sim | |

| Tabela | Campo | Tipo | Exemplo | Obrigatório | Observação |
|---|---|---|---|---|---|
| methodology_materials | id | uuid | "mat_001" | Sim | PK |
| methodology_materials | phase_id | uuid | "ph_001" | Sim | FK phases |
| methodology_materials | title | varchar | "Template de DRE" | Sim | |
| methodology_materials | type | enum | "pdf" | Sim | pdf, video, planilha, link |
| methodology_materials | file_url | varchar | "storage/metod/dre.xlsx" | Sim | |

---

## 7. Relacionamento e Alertas
Sistema de notificações reativas e proativas sobre a saúde dos clientes.

### Tabelas necessárias

| Tabela | Campo | Tipo | Exemplo | Obrigatório | Observação |
|---|---|---|---|---|---|
| alerts | id | uuid | "al_001" | Sim | PK |
| alerts | consultant_id | uuid | "usr_001" | Sim | FK users |
| alerts | client_id | uuid | "cli_001" | Sim | FK clients |
| alerts | type | enum | "sem_reuniao" | Sim | sem_reuniao, contrato_vencendo, csat_baixo |
| alerts | severity | enum | "alta" | Sim | baixa, warning, alta |
| alerts | message | text | "Cliente há 15 dias sem reunião" | Sim | |
| alerts | is_resolved | boolean | false | Sim | |

---

## 8. Integrações
Configurações de conexão com provedores externos.

### Tabelas necessárias

| Tabela | Campo | Tipo | Exemplo | Obrigatório | Observação |
|---|---|---|---|---|---|
| consultant_integrations | id | uuid | "int_001" | Sim | PK |
| consultant_integrations | consultant_id | uuid | "usr_001" | Sim | FK users |
| consultant_integrations | provider | enum | "calendly" | Sim | calendly, google, outlook |
| consultant_integrations | credentials_json | jsonb | {"token": "..."} | Sim | Criptografar tokens sensíveis |
| consultant_integrations | status | enum | "active" | Sim | active, expired, error |

---

## 9. Meu Perfil
Dados cadastrais e preferências do consultor.

### Tabelas necessárias

| Tabela | Campo | Tipo | Exemplo | Obrigatório | Observação |
|---|---|---|---|---|---|
| users | id | uuid | "usr_001" | Sim | PK (Auth Supabase) |
| users | email | varchar | "consultor@seven.com" | Sim | |
| users | full_name | varchar | "João Silva" | Sim | |
| users | avatar_url | varchar | "storage/avatars/001.jpg" | Não | |
| users | role | enum | "consultor" | Sim | admin, consultor, cliente |

---

## 10. Renovações
Pipeline de contratos próximos ao vencimento.

### Tabelas necessárias

| Tabela | Campo | Tipo | Exemplo | Obrigatório | Observação |
|---|---|---|---|---|---|
| renewals | id | uuid | "ren_001" | Sim | PK |
| renewals | client_id | uuid | "cli_001" | Sim | FK clients |
| renewals | current_contract_id | uuid | "cont_001" | Sim | |
| renewals | expiration_date | date | "2026-12-31" | Sim | |
| renewals | status | enum | "em_negociacao" | Sim | em_negociacao, renovado, perdido |
| renewals | value_estimate | decimal | 15000.00 | Não | Valor previsto para renovação |

---

## 11. Permissões
Controle de acesso granular por módulo.

### Tabelas necessárias

| Tabela | Campo | Tipo | Exemplo | Obrigatório | Observação |
|---|---|---|---|---|---|
| permissions | id | uuid | "perm_001" | Sim | PK |
| permissions | user_id | uuid | "usr_001" | Sim | FK users |
| permissions | module | varchar | "clientes" | Sim | módulo alvo |
| permissions | can_view | boolean | true | Sim | |
| permissions | can_edit | boolean | true | Sim | |

---

## 12. Resumo final das tabelas

| Tabela | Finalidade | Prioridade MVP | Status |
|---|---|---|---|
| users | Base de usuários e autenticação | Alta | MVP |
| clients | Cadastro central de clientes | Alta | MVP |
| consultant_clients | Relacionamento N:N consultor-cliente | Alta | MVP |
| consultant_metrics | Cache de performance do consultor | Média | MVP |
| meetings | Agenda e pautas de reuniões | Alta | MVP |
| tasks | Kanban de atividades do consultor | Alta | MVP |
| documents | Storage e status de entregáveis | Média | MVP |
| methodology_phases | Definição da jornada Seven | Alta | MVP |
| methodology_materials | Biblioteca de templates e apoio | Alta | MVP |
| alerts | Notificações de saúde e urgência | Média | Beta |
| renewals | Pipeline de retenção e upsell | Média | Em aberto |
| consultant_integrations | Conexão com Calendly/Google | Alta | MVP |

---

## 13. Observações de Implementação

1. **Relações de Segurança (RLS):** Toda query para o consultor deve incluir `WHERE consultant_id = auth.uid()` ou via tabela de junção `consultant_clients`.
2. **Campos Beta:** O "Índice Seven" deve ser uma `view` calculada no banco de dados com base em reuniões, tarefas concluídas e NPS, permitindo ajustes na fórmula sem mudar o esquema.
3. **Storage:** Arquivos de `documents` e `methodology_materials` devem ser armazenados em Buckets distintos (privado para documentos de clientes e público/interno para metodologia).
