-- Restrict google_connections SELECT to owner only
DROP POLICY IF EXISTS "Users can view their own google connection (metadata only)" ON public.google_connections;
CREATE POLICY "Users can view their own google connection (metadata only)"
ON public.google_connections
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Remove overly permissive insert policy on meeting_status_history
DROP POLICY IF EXISTS "Authenticated users can insert status history" ON public.meeting_status_history;