-- 1. Fix Storage policies for methodology-materials
UPDATE storage.buckets SET public = true WHERE id = 'methodology-materials';

DROP POLICY IF EXISTS "Public Access - Anyone can view methodology materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin Full Access - methodology materials" ON storage.objects;

CREATE POLICY "Public Access - methodology-materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'methodology-materials');

CREATE POLICY "Admin All Access - methodology-materials"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'methodology-materials' AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK (bucket_id = 'methodology-materials' AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');


-- 2. Fix Methodology Materials Table Policies
DROP POLICY IF EXISTS "Methodology materials are viewable by everyone authenticated" ON methodology_materials;
DROP POLICY IF EXISTS "Admin can manage methodology_materials" ON methodology_materials;

CREATE POLICY "Anyone can view methodology_materials"
ON methodology_materials FOR SELECT
USING (true);

CREATE POLICY "Admin can manage methodology_materials"
ON methodology_materials FOR ALL
TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');


-- 3. Fix Methodology Phases Table Policies (Ensure anyone can view)
DROP POLICY IF EXISTS "Methodology phases are viewable by everyone authenticated" ON methodology_phases;
DROP POLICY IF EXISTS "Admin can manage methodology_phases" ON methodology_phases;

CREATE POLICY "Anyone can view methodology_phases"
ON methodology_phases FOR SELECT
USING (true);

CREATE POLICY "Admin can manage methodology_phases"
ON methodology_phases FOR ALL
TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 4. Grant permissions to anon and authenticated roles
GRANT ALL ON TABLE public.methodology_materials TO authenticated;
GRANT ALL ON TABLE public.methodology_materials TO service_role;
GRANT SELECT ON TABLE public.methodology_materials TO anon;

GRANT ALL ON TABLE public.methodology_phases TO authenticated;
GRANT ALL ON TABLE public.methodology_phases TO service_role;
GRANT SELECT ON TABLE public.methodology_phases TO anon;
