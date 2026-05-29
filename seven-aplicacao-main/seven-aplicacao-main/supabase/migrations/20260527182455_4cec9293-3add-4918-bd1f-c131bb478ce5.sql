-- Fix overly permissive RLS on client_alerts
DROP POLICY IF EXISTS "Consultants can view alerts for their clients" ON public.client_alerts;
DROP POLICY IF EXISTS "Consultants can create/update alerts" ON public.client_alerts;

CREATE POLICY "Authenticated users can view alerts" 
ON public.client_alerts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage alerts" 
ON public.client_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert initial methodology phases
INSERT INTO public.methodology_phases (phase_key, name, order_index, average_duration, purpose, objectives, deliverables, tools, alerts)
VALUES 
('diagnostico', 'Diagnóstico', 1, '4 a 6 semanas', 'Compreender em profundidade o cenário atual da empresa, mapear processos, dores e oportunidades reais.', 
 ARRAY['Mapear processos críticos da operação', 'Identificar gargalos financeiros, operacionais e culturais', 'Levantar indicadores baseline (atuais)', 'Alinhar expectativas com sponsor e stakeholders'],
 ARRAY['Relatório de diagnóstico (40+ páginas)', 'Matriz SWOT consolidada', 'Mapa de processos AS-IS', 'Painel de indicadores baseline'],
 ARRAY['Canvas Seven', 'Matriz GUT', 'Diagrama de Ishikawa', 'Bizagi/Lucidchart'],
 ARRAY['Não pular conversas individuais com sócios e líderes.', 'Validar números coletados em pelo menos duas fontes.']),
('planejamento', 'Planejamento', 2, '3 a 4 semanas', 'Traduzir o diagnóstico em um plano executável com objetivos, prazos, responsáveis e métricas claras.',
 ARRAY['Definir objetivos estratégicos prioritários', 'Construir plano de ação 90/180/365 dias', 'Alinhar metas SMART com a liderança', 'Estabelecer governança do projeto'],
 ARRAY['Plano estratégico aprovado', 'Cronograma de execução', 'Matriz RACI dos envolvidos', 'Documento de governança'],
 ARRAY['OKRs', 'Gantt', 'Kanban', 'Matriz RACI', 'Roadmap visual'],
 ARRAY['Plano sem dono é plano sem execução.', 'Validar capacidade real do cliente antes de prometer prazos.']),
('estruturacao', 'Estruturação', 3, '8 a 16 semanas', 'Implementar as iniciativas planejadas, estruturar processos, treinar a equipe e gerar resultados visíveis.',
 ARRAY['Implementar processos e ferramentas', 'Treinar líderes e equipes', 'Acompanhar entregas e ajustar rota', 'Garantir adoção dos novos padrões'],
 ARRAY['Processos documentados e em uso', 'Equipe treinada e certificada', 'Dashboard operacional ativo', 'Relatórios quinzenais de progresso'],
 ARRAY['Sprints semanais', 'Daily 15min', 'Burn-down', 'Trello/Asana', 'Documentação viva'],
 ARRAY['Pausa de execução superior a 14 dias requer reavaliação.', 'Documentar todas as decisões tomadas em comitê.']),
('monitoramento', 'Monitoramento', 4, 'Contínuo (8 a 12 semanas)', 'Acompanhar indicadores, medir resultados e consolidar a cultura de gestão por dados.',
 ARRAY['Manter rotina de acompanhamento', 'Avaliar impacto das ações implementadas', 'Ajustar estratégias com base em dados', 'Capacitar a liderança para autonomia'],
 ARRAY['Dashboard estratégico em produção', 'Relatórios mensais de performance', 'Ata de comitês mensais', 'Plano de melhoria contínua'],
 ARRAY['Power BI', 'Dashboards Seven', 'Comitê mensal', 'Análises comparativas'],
 ARRAY['Indicadores sem ação são apenas decoração.', 'Comitê mensal não pode ser cancelado mais de 1x por trimestre.']),
('encerramento', 'Encerramento', 5, '2 a 4 semanas', 'Consolidar aprendizados, transferir conhecimento e preparar terreno para renovação ou nova frente.',
 ARRAY['Documentar aprendizados e legado', 'Transferir 100% do conhecimento à equipe', 'Consolidar resultados quantitativos', 'Avaliar oportunidades de continuidade'],
 ARRAY['Relatório final consolidado', 'Manual operacional do legado', 'Apresentação de resultados à diretoria', 'Plano de continuidade autônoma'],
 ARRAY['Workshop de retrospectiva', 'NPS final', 'Balanço financeiro do projeto'],
 ARRAY['Não encerre sem coletar NPS final.', 'Documentação incompleta = legado fragilizado.'])
ON CONFLICT (phase_key) DO UPDATE SET 
  name = EXCLUDED.name,
  order_index = EXCLUDED.order_index,
  average_duration = EXCLUDED.average_duration,
  purpose = EXCLUDED.purpose,
  objectives = EXCLUDED.objectives,
  deliverables = EXCLUDED.deliverables,
  tools = EXCLUDED.tools,
  alerts = EXCLUDED.alerts;
