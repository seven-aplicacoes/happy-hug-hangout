-- Adicionar políticas para administradores gerenciarem outras tabelas da metodologia
DO $$ 
DECLARE
    table_name_var TEXT;
    tables_to_fix TEXT[] := ARRAY['methodology_phases', 'methodology_materials', 'methodology_templates', 'methodology_questions'];
BEGIN
    FOREACH table_name_var IN ARRAY tables_to_fix
    LOOP
        -- ALL policy for admin
        EXECUTE format('
            DO $inner$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE tablename = %L 
                    AND policyname = %L
                ) THEN
                    CREATE POLICY %I ON public.%I 
                    FOR ALL 
                    TO authenticated 
                    USING (is_admin())
                    WITH CHECK (is_admin());
                END IF;
            END $inner$;', 
            table_name_var, 
            'Admin can manage ' || table_name_var,
            'Admin can manage ' || table_name_var,
            table_name_var
        );

        -- GRANTS
        EXECUTE format('GRANT ALL ON public.%I TO authenticated;', table_name_var);
        EXECUTE format('GRANT ALL ON public.%I TO service_role;', table_name_var);
    END LOOP;
END $$;
