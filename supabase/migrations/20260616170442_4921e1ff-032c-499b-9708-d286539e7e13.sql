
-- =========================================================
-- 1) google_connections / microsoft_connections: hide tokens
-- =========================================================

-- Drop user-facing policies; keep only service_role full access
DROP POLICY IF EXISTS "Admins can manage all google connections" ON public.google_connections;
DROP POLICY IF EXISTS "Users can manage their own google connection" ON public.google_connections;
DROP POLICY IF EXISTS "Users can view their own google connections" ON public.google_connections;

DROP POLICY IF EXISTS "Users can manage their own microsoft connections" ON public.microsoft_connections;

-- Service role full access (explicit)
CREATE POLICY "Service role manages google connections"
  ON public.google_connections FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages microsoft connections"
  ON public.microsoft_connections FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Revoke direct table privileges from anon/authenticated
REVOKE ALL ON public.google_connections FROM anon, authenticated;
REVOKE ALL ON public.microsoft_connections FROM anon, authenticated;
GRANT ALL ON public.google_connections TO service_role;
GRANT ALL ON public.microsoft_connections TO service_role;

-- Safe views without tokens for client-side "is connected" reads
DROP VIEW IF EXISTS public.google_connections_safe;
CREATE VIEW public.google_connections_safe
WITH (security_invoker = on) AS
SELECT id, user_id, google_email, expires_at, scopes, scope_type, connected_by, status, created_at, updated_at
FROM public.google_connections;

DROP VIEW IF EXISTS public.microsoft_connections_safe;
CREATE VIEW public.microsoft_connections_safe
WITH (security_invoker = on) AS
SELECT id, user_id, email, expires_at, scopes, provider, created_at, updated_at
FROM public.microsoft_connections;

-- The views run with caller's privileges; since base table has no
-- user-facing policies, callers see nothing. Add scoped SELECT policies
-- on base tables that ONLY expose non-token columns through the views.
CREATE POLICY "Users can view their own google connection (metadata only)"
  ON public.google_connections FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR scope_type = 'global');

CREATE POLICY "Users can view their own microsoft connection (metadata only)"
  ON public.microsoft_connections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Grant SELECT only on the safe views (not the base tables)
GRANT SELECT ON public.google_connections_safe TO authenticated;
GRANT SELECT ON public.microsoft_connections_safe TO authenticated;

-- =========================================================
-- 2) meeting_history: block writes from authenticated users
-- =========================================================
REVOKE INSERT, UPDATE, DELETE ON public.meeting_history FROM anon, authenticated;
GRANT ALL ON public.meeting_history TO service_role;

CREATE POLICY "Service role manages meeting history"
  ON public.meeting_history FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =========================================================
-- 3) meeting_sync_logs: scope consultants to their own meetings
-- =========================================================
DROP POLICY IF EXISTS "Admins and Consultants can view logs" ON public.meeting_sync_logs;

CREATE POLICY "Admins view all sync logs"
  ON public.meeting_sync_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
    )
  );

CREATE POLICY "Consultants view sync logs for their own meetings"
  ON public.meeting_sync_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_sync_logs.meeting_id
        AND m.consultant_id = auth.uid()
    )
  );
