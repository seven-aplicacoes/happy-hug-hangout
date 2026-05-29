-- Grant permissions for methodology_plan_phases
GRANT ALL ON public.methodology_plan_phases TO authenticated;
GRANT ALL ON public.methodology_plan_phases TO service_role;
GRANT ALL ON public.methodology_plan_phases TO postgres;
GRANT ALL ON public.methodology_plan_phases TO anon;

-- Also ensure products has grants
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.products TO postgres;
GRANT ALL ON public.products TO anon;
