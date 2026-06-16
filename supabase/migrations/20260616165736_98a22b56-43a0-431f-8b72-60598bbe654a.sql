
DROP POLICY IF EXISTS "Clients can view consultant slots" ON public.consultant_available_slots;
CREATE POLICY "Clients can view consultant slots"
ON public.consultant_available_slots
FOR SELECT
TO authenticated
USING (
  (client_id IN (SELECT clients.id FROM clients WHERE clients.auth_user_id = auth.uid()))
  OR (consultant_id IN (
    SELECT ct.consultant_id FROM contracts ct
    JOIN clients c ON c.id = ct.client_id
    WHERE c.auth_user_id = auth.uid() AND ct.status = 'ativo'::contract_status
  ))
  OR (contract_module_meeting_id IN (
    SELECT cmm.id FROM contract_module_meetings cmm
    JOIN clients c ON c.id = cmm.client_id
    WHERE c.auth_user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Minutes are viewable by assigned consultant and admins" ON public.meeting_minutes;
CREATE POLICY "Minutes are viewable by assigned consultant and admins"
ON public.meeting_minutes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = meeting_minutes.meeting_id
      AND (m.consultant_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role))
  )
  OR (visible_to_client = true AND EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = meeting_minutes.meeting_id AND m.client_id = auth.uid()
  ))
);
