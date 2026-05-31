
-- consultant_calendly_event_types: restrict to authenticated
DROP POLICY IF EXISTS "Authenticated can view event types" ON public.consultant_calendly_event_types;
DROP POLICY IF EXISTS "Users can view their own event types or all if admin" ON public.consultant_calendly_event_types;
DROP POLICY IF EXISTS "Consultants manage their own event types" ON public.consultant_calendly_event_types;

CREATE POLICY "Authenticated can view event types"
ON public.consultant_calendly_event_types
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Consultants manage their own event types"
ON public.consultant_calendly_event_types
FOR ALL TO authenticated
USING (auth.uid() = consultant_id)
WITH CHECK (auth.uid() = consultant_id);

-- meeting_history_events
DROP POLICY IF EXISTS "Service role can manage history events" ON public.meeting_history_events;
DROP POLICY IF EXISTS "Users can view meeting history events" ON public.meeting_history_events;

CREATE POLICY "Service role can manage history events"
ON public.meeting_history_events
FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Users can view meeting history events"
ON public.meeting_history_events
FOR SELECT TO authenticated
USING (true);

-- meeting_scheduling_events
DROP POLICY IF EXISTS "Service role can manage scheduling events" ON public.meeting_scheduling_events;
DROP POLICY IF EXISTS "Users can view scheduling events" ON public.meeting_scheduling_events;

CREATE POLICY "Service role can manage scheduling events"
ON public.meeting_scheduling_events
FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Users can view scheduling events"
ON public.meeting_scheduling_events
FOR SELECT TO authenticated
USING (true);

-- consultant_permissions: restrict to authenticated
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.consultant_permissions;
DROP POLICY IF EXISTS "Consultants can view their own permissions" ON public.consultant_permissions;

CREATE POLICY "Consultants can view their own permissions"
ON public.consultant_permissions
FOR SELECT TO authenticated
USING (auth.uid() = consultant_id);

-- contract_module_documents: allow clients to view their own
CREATE POLICY "Clients can view their own contract module documents"
ON public.contract_module_documents
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = contract_module_documents.client_id
      AND c.auth_user_id = auth.uid()
  )
);
