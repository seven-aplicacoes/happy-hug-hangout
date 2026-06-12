
-- 1. google_connections: remove token exposure to all authenticated users
DROP POLICY IF EXISTS "Authenticated users can view global google connections" ON public.google_connections;

-- google_connections manage policy -> authenticated
DROP POLICY IF EXISTS "Users can manage their own google connection" ON public.google_connections;
CREATE POLICY "Users can manage their own google connection"
ON public.google_connections
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. contract_module_meetings client update -> authenticated
DROP POLICY IF EXISTS "Clients can update their own module meetings" ON public.contract_module_meetings;
CREATE POLICY "Clients can update their own module meetings"
ON public.contract_module_meetings
FOR UPDATE
TO authenticated
USING (client_id IN (SELECT clients.id FROM public.clients WHERE clients.auth_user_id = auth.uid()));

-- 3. meeting_minutes INSERT/UPDATE -> authenticated
DROP POLICY IF EXISTS "Consultants can create minutes for their meetings" ON public.meeting_minutes;
CREATE POLICY "Consultants can create minutes for their meetings"
ON public.meeting_minutes
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.meetings m
  WHERE m.id = meeting_minutes.meeting_id
    AND (m.consultant_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
    ))
));

DROP POLICY IF EXISTS "Consultants can update their own minutes" ON public.meeting_minutes;
CREATE POLICY "Consultants can update their own minutes"
ON public.meeting_minutes
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.meetings m
  WHERE m.id = meeting_minutes.meeting_id
    AND (m.consultant_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
    ))
));

-- 4. meeting_status_history: restrict roles + tighten broad SELECT
DROP POLICY IF EXISTS "Anyone authenticated can view meeting history" ON public.meeting_status_history;
DROP POLICY IF EXISTS "Authenticated users can insert status history" ON public.meeting_status_history;
CREATE POLICY "Authenticated users can insert status history"
ON public.meeting_status_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Clients can insert meeting status history" ON public.meeting_status_history;
CREATE POLICY "Clients can insert meeting status history"
ON public.meeting_status_history
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.meetings m
    WHERE m.id = meeting_status_history.meeting_id
      AND m.client_id IN (SELECT clients.id FROM public.clients WHERE clients.auth_user_id = auth.uid())
  ) OR changed_by = auth.uid()
);

DROP POLICY IF EXISTS "Clients can view their meeting status history" ON public.meeting_status_history;
CREATE POLICY "Clients can view their meeting status history"
ON public.meeting_status_history
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.meetings m
  WHERE m.id = meeting_status_history.meeting_id
    AND m.client_id IN (SELECT clients.id FROM public.clients WHERE clients.auth_user_id = auth.uid())
));

DROP POLICY IF EXISTS "Users can view history of meetings they have access to" ON public.meeting_status_history;
CREATE POLICY "Users can view history of meetings they have access to"
ON public.meeting_status_history
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.meetings m
  WHERE m.id = meeting_status_history.meeting_id
    AND (
      m.consultant_id = auth.uid()
      OR m.client_id IN (SELECT clients.id FROM public.clients WHERE clients.auth_user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role)
    )
));

-- 5. meetings: client policies -> authenticated
DROP POLICY IF EXISTS "Clients can insert meetings for themselves" ON public.meetings;
CREATE POLICY "Clients can insert meetings for themselves"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (client_id IN (SELECT clients.id FROM public.clients WHERE clients.auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Clients can update their own meetings" ON public.meetings;
CREATE POLICY "Clients can update their own meetings"
ON public.meetings
FOR UPDATE
TO authenticated
USING (client_id IN (SELECT clients.id FROM public.clients WHERE clients.auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Clients can view their own meetings" ON public.meetings;
CREATE POLICY "Clients can view their own meetings"
ON public.meetings
FOR SELECT
TO authenticated
USING (
  client_id IN (SELECT clients.id FROM public.clients WHERE clients.auth_user_id = auth.uid())
  OR consultant_id = auth.uid()
);

-- 6. meeting_history: authenticated + remove tautology
DROP POLICY IF EXISTS "Users can view history of their meetings" ON public.meeting_history;
CREATE POLICY "Users can view history of their meetings"
ON public.meeting_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.meetings m
    WHERE m.id = meeting_history.meeting_id
      AND (
        m.consultant_id = auth.uid()
        OR m.client_id IN (SELECT clients.id FROM public.clients WHERE clients.auth_user_id = auth.uid())
      )
  )
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role)
);

-- 7. meeting_sync_logs: authenticated
DROP POLICY IF EXISTS "Admins and Consultants can view logs" ON public.meeting_sync_logs;
CREATE POLICY "Admins and Consultants can view logs"
ON public.meeting_sync_logs
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = auth.uid() AND (p.role = 'admin'::public.user_role OR p.role = 'consultor'::public.user_role)
));

-- 8. client_contacts: consultants can insert/update/delete only for their clients
CREATE POLICY "Consultants can insert contacts for their clients"
ON public.client_contacts
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.clients
  WHERE clients.id = client_contacts.client_id AND clients.consultant_id = auth.uid()
));

CREATE POLICY "Consultants can update contacts for their clients"
ON public.client_contacts
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.clients
  WHERE clients.id = client_contacts.client_id AND clients.consultant_id = auth.uid()
));

CREATE POLICY "Consultants can delete contacts for their clients"
ON public.client_contacts
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.clients
  WHERE clients.id = client_contacts.client_id AND clients.consultant_id = auth.uid()
));
