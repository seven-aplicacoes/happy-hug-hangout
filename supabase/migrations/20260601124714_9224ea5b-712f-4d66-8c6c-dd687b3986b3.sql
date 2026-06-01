-- Update meetings table with new synchronization columns
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Fortaleza',
ADD COLUMN IF NOT EXISTS microsoft_event_web_link TEXT,
ADD COLUMN IF NOT EXISTS microsoft_organizer_email TEXT,
ADD COLUMN IF NOT EXISTS microsoft_graph_response JSONB,
ADD COLUMN IF NOT EXISTS microsoft_last_sync_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS microsoft_sync_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS microsoft_sync_error TEXT,
ADD COLUMN IF NOT EXISTS agenda TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create meeting_sync_logs table
CREATE TABLE IF NOT EXISTS public.meeting_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    provider TEXT DEFAULT 'microsoft_graph',
    request_payload JSONB,
    response_payload JSONB,
    status_code INT,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.meetings TO authenticated;
GRANT ALL ON public.meeting_sync_logs TO authenticated;
GRANT ALL ON public.meeting_sync_logs TO service_role;

-- Enable RLS for logs
ALTER TABLE public.meeting_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policies for logs
CREATE POLICY "Admins and Consultants can view logs" 
ON public.meeting_sync_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.role = 'consultor')
  )
);

CREATE POLICY "Service role can do everything on logs"
ON public.meeting_sync_logs
FOR ALL
USING (true)
WITH CHECK (true);
