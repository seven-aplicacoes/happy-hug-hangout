
-- Restrict permissive ALL policies to service_role only
DROP POLICY IF EXISTS "Service role manages history events" ON public.meeting_history_events;
DROP POLICY IF EXISTS "Service role can manage history events" ON public.meeting_history_events;
CREATE POLICY "Service role manages history events" ON public.meeting_history_events
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages scheduling events" ON public.meeting_scheduling_events;
DROP POLICY IF EXISTS "Service role can manage scheduling events" ON public.meeting_scheduling_events;
CREATE POLICY "Service role manages scheduling events" ON public.meeting_scheduling_events
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can do everything on logs" ON public.meeting_sync_logs;
CREATE POLICY "Service role can do everything on logs" ON public.meeting_sync_logs
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
