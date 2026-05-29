-- Adicionar políticas para administradores gerenciarem as etapas da metodologia
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'methodology_plan_phases' 
        AND policyname = 'Admin can manage methodology_plan_phases'
    ) THEN
        CREATE POLICY "Admin can manage methodology_plan_phases" 
        ON public.methodology_plan_phases 
        FOR ALL 
        TO authenticated 
        USING (is_admin())
        WITH CHECK (is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'methodology_plans' 
        AND policyname = 'Admin can manage methodology_plans'
    ) THEN
        CREATE POLICY "Admin can manage methodology_plans" 
        ON public.methodology_plans 
        FOR ALL 
        TO authenticated 
        USING (is_admin())
        WITH CHECK (is_admin());
    END IF;
END $$;

-- Garantir GRANTs para authenticated e service_role
GRANT ALL ON public.methodology_plan_phases TO authenticated;
GRANT ALL ON public.methodology_plan_phases TO service_role;
GRANT ALL ON public.methodology_plans TO authenticated;
GRANT ALL ON public.methodology_plans TO service_role;
