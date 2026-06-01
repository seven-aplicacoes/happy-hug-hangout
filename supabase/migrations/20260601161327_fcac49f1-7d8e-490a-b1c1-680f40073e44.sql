-- Create table for Google connections
CREATE TABLE public.google_connections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    google_email TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    scopes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_connections TO authenticated;
GRANT ALL ON public.google_connections TO service_role;

-- Enable RLS
ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for google_connections
CREATE POLICY "Users can manage their own google connection"
ON public.google_connections
FOR ALL
USING (auth.uid() = user_id);

-- Add columns to meetings table
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS meet_join_url TEXT,
ADD COLUMN IF NOT EXISTS google_event_id TEXT,
ADD COLUMN IF NOT EXISTS calendar_sync_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS calendar_sync_error TEXT;

-- Trigger to update updated_at on google_connections
CREATE TRIGGER set_updated_at_google_connections
BEFORE UPDATE ON public.google_connections
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
