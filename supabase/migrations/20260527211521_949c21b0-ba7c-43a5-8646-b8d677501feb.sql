
-- 1. client_alerts: replace permissive policies
DROP POLICY IF EXISTS "Authenticated users can manage alerts" ON public.client_alerts;
DROP POLICY IF EXISTS "Authenticated users can view alerts" ON public.client_alerts;

CREATE POLICY "Admins manage all client alerts"
ON public.client_alerts FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Consultants manage their client alerts"
ON public.client_alerts FOR ALL TO authenticated
USING (
  consultant_id = auth.uid()
  OR client_id IN (SELECT id FROM public.clients WHERE consultant_id = auth.uid())
)
WITH CHECK (
  consultant_id = auth.uid()
  OR client_id IN (SELECT id FROM public.clients WHERE consultant_id = auth.uid())
);

CREATE POLICY "Clients view their own alerts"
ON public.client_alerts FOR SELECT TO authenticated
USING (
  current_user_role() = 'cliente'::user_role
  AND client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);

-- 2. client_indicators: replace permissive SELECT, add scoped write
DROP POLICY IF EXISTS "Client indicators are viewable by everyone authenticated" ON public.client_indicators;

CREATE POLICY "Admins manage all client indicators"
ON public.client_indicators FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Consultants manage indicators of their clients"
ON public.client_indicators FOR ALL TO authenticated
USING (client_id IN (SELECT id FROM public.clients WHERE consultant_id = auth.uid()))
WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE consultant_id = auth.uid()));

CREATE POLICY "Clients view their own indicators"
ON public.client_indicators FOR SELECT TO authenticated
USING (
  current_user_role() = 'cliente'::user_role
  AND client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);

-- 3. integrations: admin-only read
DROP POLICY IF EXISTS "Integrations are viewable by everyone authenticated" ON public.integrations;
CREATE POLICY "Admins view integrations"
ON public.integrations FOR SELECT TO authenticated
USING (is_admin());
CREATE POLICY "Admins manage integrations"
ON public.integrations FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-- 4. integration_events: admin-only read
DROP POLICY IF EXISTS "Integration events are viewable by everyone authenticated" ON public.integration_events;
CREATE POLICY "Admins view integration events"
ON public.integration_events FOR SELECT TO authenticated
USING (is_admin());
CREATE POLICY "Admins manage integration events"
ON public.integration_events FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-- 5. profiles: prevent self privilege escalation
-- The prevent_role_self_escalation trigger function exists; ensure trigger is attached.
DROP TRIGGER IF EXISTS prevent_role_self_escalation_trg ON public.profiles;
CREATE TRIGGER prevent_role_self_escalation_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();

-- Replace the UPDATE policy with a WITH CHECK that blocks role/status self-change for non-admins
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING ((auth.uid() = id) OR is_admin())
WITH CHECK (
  is_admin()
  OR (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND status = (SELECT status FROM public.profiles WHERE id = auth.uid())
  )
);
