-- Drop old table if exists (from previous iteration)
DROP TABLE IF EXISTS public.consultant_kpi_targets;

-- Create default_indicator_goals table
CREATE TABLE public.default_indicator_goals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    indicator_key TEXT NOT NULL UNIQUE,
    indicator_label TEXT NOT NULL,
    default_goal_value NUMERIC,
    goal_type TEXT NOT NULL, -- 'minimum', 'maximum', 'target', 'informational'
    comparison_operator TEXT NOT NULL, -- 'greater_or_equal', 'less_or_equal', 'equal', 'none'
    period_type TEXT DEFAULT 'monthly',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create consultant_indicator_goals table
CREATE TABLE public.consultant_indicator_goals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    consultant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    indicator_key TEXT NOT NULL,
    indicator_label TEXT NOT NULL,
    goal_value NUMERIC,
    goal_type TEXT NOT NULL,
    comparison_operator TEXT NOT NULL,
    period_type TEXT DEFAULT 'monthly',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(consultant_id, indicator_key, period_type)
);

-- Use GRANT to set permissions
GRANT SELECT ON public.default_indicator_goals TO authenticated;
GRANT ALL ON public.default_indicator_goals TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultant_indicator_goals TO authenticated;
GRANT ALL ON public.consultant_indicator_goals TO service_role;

-- Enable RLS
ALTER TABLE public.default_indicator_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_indicator_goals ENABLE ROW LEVEL SECURITY;

-- Policies for default_indicator_goals
CREATE POLICY "Everyone authenticated can view default goals" 
ON public.default_indicator_goals FOR SELECT USING (true);

CREATE POLICY "Admins can manage default goals" 
ON public.default_indicator_goals FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Policies for consultant_indicator_goals
CREATE POLICY "Admins can manage all consultant goals" 
ON public.consultant_indicator_goals FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Consultants can view their own goals" 
ON public.consultant_indicator_goals FOR SELECT USING (consultant_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_default_indicator_goals_updated_at
BEFORE UPDATE ON public.default_indicator_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultant_indicator_goals_updated_at
BEFORE UPDATE ON public.consultant_indicator_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default goals
INSERT INTO public.default_indicator_goals (indicator_key, indicator_label, default_goal_value, goal_type, comparison_operator) VALUES
('meetings_completed', 'Reuniões realizadas', 32, 'minimum', 'greater_or_equal'),
('csat_responses', 'CSAT respostas', 10, 'minimum', 'greater_or_equal'),
('csat_adherence', 'Adesão CSAT', 70, 'minimum', 'greater_or_equal'),
('csat_score', 'Nota CSAT', 4.5, 'minimum', 'greater_or_equal'),
('nps', 'NPS', 60, 'minimum', 'greater_or_equal'),
('meetings_per_client', 'Encontros por cliente', 4, 'minimum', 'greater_or_equal'),
('critical_clinics', 'Clínicas em crítico', 0, 'maximum', 'less_or_equal'),
('attention_clinics', 'Clínicas em atenção', 3, 'maximum', 'less_or_equal'),
('contracts_ending_90_days', 'Encerrando em 90 dias', 0, 'informational', 'none'),
('upsell_potential', 'Potencial upsell', 5, 'minimum', 'greater_or_equal'),
('active_tasks', 'Tarefas ativas', 10, 'maximum', 'less_or_equal'),
('client_portfolio', 'Meus clientes', 20, 'informational', 'none');
