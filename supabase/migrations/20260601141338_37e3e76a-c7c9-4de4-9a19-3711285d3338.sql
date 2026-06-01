-- Create microsoft_connections table for custom OAuth
CREATE TABLE IF NOT EXISTS public.microsoft_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scopes TEXT[],
    provider TEXT DEFAULT 'microsoft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, email)
);

-- Grant permissions for microsoft_connections
GRANT SELECT, INSERT, UPDATE, DELETE ON public.microsoft_connections TO authenticated;
GRANT ALL ON public.microsoft_connections TO service_role;

-- Enable RLS for microsoft_connections
ALTER TABLE public.microsoft_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own microsoft connections"
ON public.microsoft_connections
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure meeting_sync_logs has action column (already exists based on earlier check, but let's be sure)
-- If event_type exists, we can keep it for legacy or drop it if we are sure.
-- Based on the read_query, action exists. Let's make sure it's used.

-- Add sync columns to meetings if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'sync_status') THEN
        ALTER TABLE public.meetings ADD COLUMN sync_status TEXT DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'sync_error') THEN
        ALTER TABLE public.meetings ADD COLUMN sync_error TEXT;
    END IF;
END $$;

-- Create trigger for updated_at on microsoft_connections
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_microsoft_connections
BEFORE UPDATE ON public.microsoft_connections
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
