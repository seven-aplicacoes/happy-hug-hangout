-- Atualização da tabela de etapas padrão (metodologia)
ALTER TABLE public.methodology_plan_phases
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS executor_type TEXT CHECK (executor_type IN ('consultor', 'silvane')),
ADD COLUMN IF NOT EXISTS meetings_count INTEGER DEFAULT 0 CHECK (meetings_count >= 0);

-- Atualização da tabela de etapas vinculadas a produtos contratados (jornada)
ALTER TABLE public.contract_product_phases
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS executor_type TEXT CHECK (executor_type IN ('consultor', 'silvane')),
ADD COLUMN IF NOT EXISTS meetings_count INTEGER DEFAULT 0 CHECK (meetings_count >= 0);

-- Comentários para documentação
COMMENT ON COLUMN public.methodology_plan_phases.duration_minutes IS 'Duração do módulo em minutos';
COMMENT ON COLUMN public.methodology_plan_phases.executor_type IS 'Tipo de executor responsável: consultor ou silvane';
COMMENT ON COLUMN public.methodology_plan_phases.meetings_count IS 'Quantidade de encontros previstos no módulo';

COMMENT ON COLUMN public.contract_product_phases.duration_minutes IS 'Duração do módulo em minutos';
COMMENT ON COLUMN public.contract_product_phases.executor_type IS 'Tipo de executor responsável: consultor ou silvane';
COMMENT ON COLUMN public.contract_product_phases.meetings_count IS 'Quantidade de encontros previstos no módulo';
