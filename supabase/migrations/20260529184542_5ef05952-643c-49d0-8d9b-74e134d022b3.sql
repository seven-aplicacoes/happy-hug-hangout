
-- 1. contract_methodology_phases
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.contract_methodology_phases;
CREATE POLICY "Admins manage contract_methodology_phases" ON public.contract_methodology_phases
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Consultants view their contract methodology phases" ON public.contract_methodology_phases
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_methodology_phases.contract_id AND c.consultant_id = auth.uid())
  );

-- 2. contract_methodology_modules
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.contract_methodology_modules;
CREATE POLICY "Admins manage contract_methodology_modules" ON public.contract_methodology_modules
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Consultants view their contract methodology modules" ON public.contract_methodology_modules
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.contract_methodology_phases p
      JOIN public.contracts c ON c.id = p.contract_id
      WHERE p.id = contract_methodology_modules.contract_phase_id AND c.consultant_id = auth.uid()
    )
  );

-- 3. contract_methodology_meetings
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.contract_methodology_meetings;
CREATE POLICY "Admins manage contract_methodology_meetings" ON public.contract_methodology_meetings
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Consultants view their contract methodology meetings" ON public.contract_methodology_meetings
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.contract_methodology_modules m
      JOIN public.contract_methodology_phases p ON p.id = m.contract_phase_id
      JOIN public.contracts c ON c.id = p.contract_id
      WHERE m.id = contract_methodology_meetings.contract_module_id AND c.consultant_id = auth.uid()
    )
  );

-- 4. contract_methodology_deliverables
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.contract_methodology_deliverables;
CREATE POLICY "Admins manage contract_methodology_deliverables" ON public.contract_methodology_deliverables
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Consultants view their contract methodology deliverables" ON public.contract_methodology_deliverables
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.contract_methodology_meetings mt
      JOIN public.contract_methodology_modules m ON m.id = mt.contract_module_id
      JOIN public.contract_methodology_phases p ON p.id = m.contract_phase_id
      JOIN public.contracts c ON c.id = p.contract_id
      WHERE mt.id = contract_methodology_deliverables.contract_meeting_id AND c.consultant_id = auth.uid()
    )
  );

-- 5. methodology_plans + plan_modules/meetings/deliverables (if exist)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='methodology_plans') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.methodology_plans';
    EXECUTE 'CREATE POLICY "Admins manage methodology_plans" ON public.methodology_plans FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())';
    EXECUTE 'CREATE POLICY "Authenticated view methodology_plans" ON public.methodology_plans FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.methodology_plan_modules;
CREATE POLICY "Admins manage methodology_plan_modules" ON public.methodology_plan_modules
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Authenticated view methodology_plan_modules" ON public.methodology_plan_modules
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.methodology_plan_meetings;
CREATE POLICY "Admins manage methodology_plan_meetings" ON public.methodology_plan_meetings
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Authenticated view methodology_plan_meetings" ON public.methodology_plan_meetings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.methodology_plan_deliverables;
CREATE POLICY "Admins manage methodology_plan_deliverables" ON public.methodology_plan_deliverables
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Authenticated view methodology_plan_deliverables" ON public.methodology_plan_deliverables
  FOR SELECT TO authenticated USING (true);

-- 6. document_links
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.document_links;
CREATE POLICY "Admins manage document_links" ON public.document_links
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users view document_links of accessible documents" ON public.document_links
  FOR SELECT TO authenticated USING (
    document_id IS NULL OR EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_links.document_id)
  );

-- 7. methodology_phases & methodology_materials -> restrict to authenticated only
DROP POLICY IF EXISTS "Methodology phases are viewable by everyone" ON public.methodology_phases;
DROP POLICY IF EXISTS "Anyone can view methodology_phases" ON public.methodology_phases;
DROP POLICY IF EXISTS "Public can view methodology_phases" ON public.methodology_phases;
CREATE POLICY "Authenticated view methodology_phases" ON public.methodology_phases
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view methodology_materials" ON public.methodology_materials;
CREATE POLICY "Authenticated view methodology_materials" ON public.methodology_materials
  FOR SELECT TO authenticated USING (true);

-- 8. Storage: tighten Documents clients read with visibility check
DROP POLICY IF EXISTS "Documents clients read" ON storage.objects;
CREATE POLICY "Documents clients read" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'documents' AND EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.documents d ON d.client_id = c.id
      WHERE (c.id)::text = (storage.foldername(objects.name))[1]
        AND c.auth_user_id = auth.uid()
        AND d.file_path = objects.name
        AND d.visibility IN ('client','all')
    )
  );

-- 9. Harden functions: search_path + revoke anon execute on definer functions
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.seed_consultant_goals(uuid) SET search_path = public;
ALTER FUNCTION public.on_consultant_created_seed_goals() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_user_status() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.list_team_members() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.seed_consultant_goals(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.seed_default_consultant_permissions(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_team_members() TO authenticated;
