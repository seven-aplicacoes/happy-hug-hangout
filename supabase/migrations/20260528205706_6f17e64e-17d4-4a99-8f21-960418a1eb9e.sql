-- Garantir que as tabelas de metodologia tenham IDs automáticos
ALTER TABLE public.methodology_plan_phases ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.methodology_plans ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Garantir GRANTs para evitar erros de permissão
GRANT ALL ON public.methodology_plan_phases TO authenticated;
GRANT ALL ON public.methodology_plan_phases TO service_role;
GRANT ALL ON public.methodology_plans TO authenticated;
GRANT ALL ON public.methodology_plans TO service_role;
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
