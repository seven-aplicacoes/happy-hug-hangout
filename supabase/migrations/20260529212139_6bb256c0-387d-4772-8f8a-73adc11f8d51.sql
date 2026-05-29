
-- 1) Fix document_links SELECT policy: enforce same access as documents
DROP POLICY IF EXISTS "Users view document_links of accessible documents" ON public.document_links;

CREATE POLICY "Users view document_links of accessible documents"
ON public.document_links
FOR SELECT
TO authenticated
USING (
  is_admin()
  OR (
    document_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.documents d
      LEFT JOIN public.clients c ON c.id = d.client_id
      WHERE d.id = document_links.document_id
        AND (
          d.author_id = auth.uid()
          OR c.consultant_id = auth.uid()
          OR (
            c.auth_user_id = auth.uid()
            AND COALESCE(d.visibility, 'internal') IN ('client', 'all')
          )
        )
    )
  )
);

-- 2) Set fixed search_path on functions missing it
ALTER FUNCTION public.sync_contract_module_meetings_manual(uuid) SET search_path = public;
ALTER FUNCTION public.sync_contract_module_meetings() SET search_path = public;
ALTER FUNCTION public.sync_meeting_to_module_encounter() SET search_path = public;

-- 3) Revoke EXECUTE from anon/public on SECURITY DEFINER functions that should only be callable when authenticated
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_status() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.list_team_members() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.seed_consultant_goals(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.seed_default_consultant_permissions(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.prevent_role_self_escalation() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.on_consultant_created_seed_goals() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sync_meeting_to_contract_meeting() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sync_contract_phase_meetings() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_team_members() TO authenticated;
