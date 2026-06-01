-- Allow clients to update their own contract_module_meetings
CREATE POLICY "Clients can update their own module meetings"
ON public.contract_module_meetings
FOR UPDATE
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
  )
);

-- Allow clients to insert meeting status history
-- We allow insertion if the meeting_id belongs to a meeting they have access to
CREATE POLICY "Clients can insert meeting status history"
ON public.meeting_status_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.meetings m
    WHERE m.id = meeting_id
    AND m.client_id IN (
      SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
    )
  )
  OR 
  -- Allow if it's a new meeting being created (meeting_id might not be in meetings yet if in same transaction/batch, but here it's separate calls)
  -- Actually, in useReunioes, meetings is upserted FIRST, then history is inserted.
  -- So checking against meetings is correct.
  changed_by = auth.uid()
);

-- Ensure meeting_status_history is viewable by clients
CREATE POLICY "Clients can view their meeting status history"
ON public.meeting_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.meetings m
    WHERE m.id = meeting_id
    AND m.client_id IN (
      SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
    )
  )
);

-- Grant permissions on meeting_status_history
GRANT INSERT, SELECT ON public.meeting_status_history TO authenticated;
