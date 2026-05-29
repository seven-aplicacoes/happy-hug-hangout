-- Create is_admin helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to methodology tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.methodology_phases TO authenticated;
GRANT ALL ON public.methodology_phases TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.methodology_phase_objectives TO authenticated;
GRANT ALL ON public.methodology_phase_objectives TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.methodology_phase_deliverables TO authenticated;
GRANT ALL ON public.methodology_phase_deliverables TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.methodology_phase_tools TO authenticated;
GRANT ALL ON public.methodology_phase_tools TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.methodology_materials TO authenticated;
GRANT ALL ON public.methodology_materials TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.methodology_transversal_materials TO authenticated;
GRANT ALL ON public.methodology_transversal_materials TO service_role;

-- Fix RLS Policies for methodology tables
DROP POLICY IF EXISTS "Methodology phases are viewable by everyone authenticated" ON public.methodology_phases;
CREATE POLICY "Methodology phases are viewable by everyone authenticated" 
ON public.methodology_phases FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can manage methodology_phases" ON public.methodology_phases;
CREATE POLICY "Admin can manage methodology_phases" 
ON public.methodology_phases FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Methodology objectives are viewable by everyone authenticated" ON public.methodology_phase_objectives;
CREATE POLICY "Methodology objectives are viewable by everyone authenticated" 
ON public.methodology_phase_objectives FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can manage methodology_phase_objectives" ON public.methodology_phase_objectives;
CREATE POLICY "Admin can manage methodology_phase_objectives" 
ON public.methodology_phase_objectives FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Methodology deliverables are viewable by everyone authenticated" ON public.methodology_phase_deliverables;
CREATE POLICY "Methodology deliverables are viewable by everyone authenticated" 
ON public.methodology_phase_deliverables FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can manage methodology_phase_deliverables" ON public.methodology_phase_deliverables;
CREATE POLICY "Admin can manage methodology_phase_deliverables" 
ON public.methodology_phase_deliverables FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Methodology tools are viewable by everyone authenticated" ON public.methodology_phase_tools;
CREATE POLICY "Methodology tools are viewable by everyone authenticated" 
ON public.methodology_phase_tools FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can manage methodology_phase_tools" ON public.methodology_phase_tools;
CREATE POLICY "Admin can manage methodology_phase_tools" 
ON public.methodology_phase_tools FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Methodology materials are viewable by everyone authenticated" ON public.methodology_materials;
CREATE POLICY "Methodology materials are viewable by everyone authenticated" 
ON public.methodology_materials FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can manage methodology_materials" ON public.methodology_materials;
CREATE POLICY "Admin can manage methodology_materials" 
ON public.methodology_materials FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Methodology transversal materials are viewable by everyone authenticated" ON public.methodology_transversal_materials;
CREATE POLICY "Methodology transversal materials are viewable by everyone authenticated" 
ON public.methodology_transversal_materials FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can manage methodology_transversal_materials" ON public.methodology_transversal_materials;
CREATE POLICY "Admin can manage methodology_transversal_materials" 
ON public.methodology_transversal_materials FOR ALL TO authenticated USING (is_admin());

-- Storage Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('methodology-materials', 'methodology-materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies
DROP POLICY IF EXISTS "Admins can manage methodology materials" ON storage.objects;
CREATE POLICY "Admins can manage methodology materials" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'methodology-materials' AND is_admin())
WITH CHECK (bucket_id = 'methodology-materials' AND is_admin());

DROP POLICY IF EXISTS "Authenticated users can view methodology materials" ON storage.objects;
CREATE POLICY "Authenticated users can view methodology materials" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'methodology-materials');
