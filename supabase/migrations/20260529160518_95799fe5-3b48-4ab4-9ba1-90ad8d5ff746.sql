-- 1. Structural Fixes
ALTER TABLE public.methodology_plans ADD COLUMN IF NOT EXISTS objective TEXT;
ALTER TABLE public.methodology_plans ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE public.methodology_plan_phases ALTER COLUMN phase_key DROP NOT NULL;
ALTER TABLE public.methodology_plan_phases ALTER COLUMN order_index SET DEFAULT 0;
-- Fix existing nulls if any
UPDATE public.methodology_plan_phases SET order_index = 0 WHERE order_index IS NULL;

-- 2. Data Insertion for Signature
DO $$ 
DECLARE
    v_product_id UUID;
    v_plan_id UUID;
    v_phase_id UUID;
    v_module_id UUID;
    v_meeting_id UUID;
BEGIN
    -- Ensure Signature product exists
    INSERT INTO public.products (name, slug, category, status)
    VALUES ('Signature', 'signature', 'Mentoria', 'active')
    ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug
    RETURNING id INTO v_product_id;

    -- Create Methodology Plan
    INSERT INTO public.methodology_plans (product_id, name, description, objective)
    VALUES (v_product_id, 'Método Signature', 'Ecossistema de desenvolvimento e implementação da gestão', 'Estruturar a gestão da clínica médica')
    RETURNING id INTO v_plan_id;

    ---------------------------------------------------------------------------
    -- SIGNATURE 1.0
    ---------------------------------------------------------------------------
    INSERT INTO public.methodology_plan_phases (methodology_plan_id, name, subtitle, description, objective, strategic_name, order_index)
    VALUES (v_plan_id, 'Signature 1.0 — Direção Estratégica e Desbloqueio de Crescimento', 'Direção Estratégica da Clínica', 
    'O Signature 1.0 é a fase de clareza, direção e desbloqueio estratégico da clínica e do médico empresário.', 
    'fase de clareza, direção e desbloqueio estratégico da clínica e do médico empresário.',
    'Aceleração estratégica da clínica', 1)
    RETURNING id INTO v_phase_id;

    -- Module: Gente & Gestão
    INSERT INTO public.methodology_plan_modules (phase_id, name, order_index, responsible_role)
    VALUES (v_phase_id, 'Gente & Gestão', 1, 'Consultor')
    RETURNING id INTO v_module_id;

    -- Encontro 01
    INSERT INTO public.methodology_plan_meetings (module_id, meeting_number, title, area, theme, objective, order_index)
    VALUES (v_module_id, 1, 'Encontro 01', 'Gente & Gestão', 'Perfil comportamental do médico', 'Desenvolver consciência sobre perfil de liderança, tomada de decisão e comportamento', 1)
    RETURNING id INTO v_meeting_id;
    INSERT INTO public.methodology_plan_deliverables (meeting_id, title) VALUES (v_meeting_id, 'Relatório Sólides do médico com análise comportamental');

    -- Encontro 02
    INSERT INTO public.methodology_plan_meetings (module_id, meeting_number, title, area, theme, objective, order_index)
    VALUES (v_module_id, 2, 'Encontro 02', 'Gente & Gestão', 'Rotina e hábitos do médico líder', 'Estruturar rotina estratégica do médico e reduzir sobrecarga operacional', 2)
    RETURNING id INTO v_meeting_id;
    INSERT INTO public.methodology_plan_deliverables (meeting_id, title) VALUES (v_meeting_id, 'Modelo de agenda estratégica do médico');

    -- Encontro 03
    INSERT INTO public.methodology_plan_meetings (module_id, meeting_number, title, area, theme, objective, order_index)
    VALUES (v_module_id, 3, 'Encontro 03', 'Gente & Gestão', 'Organograma atual e ideal', 'Gerar clareza sobre estrutura atual e futura da clínica', 3)
    RETURNING id INTO v_meeting_id;
    INSERT INTO public.methodology_plan_deliverables (meeting_id, title) VALUES (v_meeting_id, 'Organograma atual e ideal da clínica');

    -- Encontro 04
    INSERT INTO public.methodology_plan_meetings (module_id, meeting_number, title, area, theme, objective, order_index)
    VALUES (v_module_id, 4, 'Encontro 04', 'Gente & Gestão', 'Cultura Organizacional', 'Estruturar cultura organizacional e organização mínima da gestão da equipe', 4)
    RETURNING id INTO v_meeting_id;
    INSERT INTO public.methodology_plan_deliverables (meeting_id, title) VALUES (v_meeting_id, 'Apresentação visual de cultura organizacional');

    -- Module: Marketing
    INSERT INTO public.methodology_plan_modules (phase_id, name, order_index, responsible_role)
    VALUES (v_phase_id, 'Marketing', 2, 'Consultor')
    RETURNING id INTO v_module_id;

    -- Encontro 05
    INSERT INTO public.methodology_plan_meetings (module_id, meeting_number, title, area, theme, objective, order_index)
    VALUES (v_module_id, 5, 'Encontro 05', 'Marketing', 'Essência do Médico', 'Identificar essência, autoridade e posicionamento do médico', 5)
    RETURNING id INTO v_meeting_id;
    INSERT INTO public.methodology_plan_deliverables (meeting_id, title) VALUES (v_meeting_id, 'Extração estratégica com GPT');

    ---------------------------------------------------------------------------
    -- SIGNATURE 2.0
    ---------------------------------------------------------------------------
    INSERT INTO public.methodology_plan_phases (methodology_plan_id, name, objective, description, order_index)
    VALUES (v_plan_id, 'Signature 2.0 — Estruturação da Gestão', 'fase de estruturação essencial da gestão.', 
    'O Signature 2.0 é a fase de estruturação essencial da gestão.', 2)
    RETURNING id INTO v_phase_id;

    -- Module: Estruturação de Gente & Gestão
    INSERT INTO public.methodology_plan_modules (phase_id, name, description, objective, responsible_role, order_index)
    VALUES (v_phase_id, 'Estruturação de Gente & Gestão', 'Os 7 passos para estruturar a gestão de pessoas da clínica.', 'Organizar pessoas e cultura', 'Consultor', 1)
    RETURNING id INTO v_module_id;

    -- Etapa 1
    INSERT INTO public.methodology_plan_meetings (module_id, title, objective, what_is_structured, duration_meeting, duration_development, order_index)
    VALUES (v_module_id, 'Etapa 1: Estrutura Organizacional e Cultura', 'Construir a base organizacional da clínica', 'Organograma, cultura, missão, visão, regras, comportamentos e ritos', 60, 120, 1)
    RETURNING id INTO v_meeting_id;
    INSERT INTO public.methodology_plan_deliverables (meeting_id, title) VALUES (v_meeting_id, 'Livro de Cultura');

END $$;
