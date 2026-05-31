
-- consultant_calendly_event_types
DROP POLICY IF EXISTS "Users can view their own event types or all if admin" ON public.consultant_calendly_event_types;
DROP POLICY IF EXISTS "Consultants can manage their own event types" ON public.consultant_calendly_event_types;
CREATE POLICY "Authenticated can view event types" ON public.consultant_calendly_event_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Consultants manage their own event types" ON public.consultant_calendly_event_types FOR ALL TO authenticated USING (auth.uid() = consultant_id) WITH CHECK (auth.uid() = consultant_id);

-- consultant_permissions: remove duplicate {public} policy
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.consultant_permissions;

-- meeting_history_events
DROP POLICY IF EXISTS "Admins can view all history events" ON public.meeting_history_events;
DROP POLICY IF EXISTS "Clients can view their own history events" ON public.meeting_history_events;
DROP POLICY IF EXISTS "Consultants can view their own history events" ON public.meeting_history_events;
DROP POLICY IF EXISTS "Service role can manage history events" ON public.meeting_history_events;
DROP POLICY IF EXISTS "Users can view meeting history events" ON public.meeting_history_events;
CREATE POLICY "Admins view history events" ON public.meeting_history_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role));
CREATE POLICY "Clients view own history events" ON public.meeting_history_events FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid()));
CREATE POLICY "Consultants view own history events" ON public.meeting_history_events FOR SELECT TO authenticated USING (consultant_id = auth.uid());
CREATE POLICY "Service role manages history events" ON public.meeting_history_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- meeting_scheduling_events
DROP POLICY IF EXISTS "Admins can view all scheduling events" ON public.meeting_scheduling_events;
DROP POLICY IF EXISTS "Clients can view their own scheduling events" ON public.meeting_scheduling_events;
DROP POLICY IF EXISTS "Consultants can view their own scheduling events" ON public.meeting_scheduling_events;
DROP POLICY IF EXISTS "Service role can manage scheduling events" ON public.meeting_scheduling_events;
DROP POLICY IF EXISTS "Users can view scheduling events" ON public.meeting_scheduling_events;
CREATE POLICY "Admins view scheduling events" ON public.meeting_scheduling_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role));
CREATE POLICY "Clients view own scheduling events" ON public.meeting_scheduling_events FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid()));
CREATE POLICY "Consultants view own scheduling events" ON public.meeting_scheduling_events FOR SELECT TO authenticated USING (consultant_id = auth.uid());
CREATE POLICY "Service role manages scheduling events" ON public.meeting_scheduling_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- contract_module_documents: allow clients to view their own
CREATE POLICY "Clients view their own contract module documents" ON public.contract_module_documents FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM clients c WHERE c.id = contract_module_documents.client_id AND c.auth_user_id = auth.uid())
);

-- Fix mutable search_path
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
