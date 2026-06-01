-- Ensure fields exist on meetings table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meetings' AND column_name='canceled_by') THEN
        ALTER TABLE public.meetings ADD COLUMN canceled_by UUID REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meetings' AND column_name='canceled_at') THEN
        ALTER TABLE public.meetings ADD COLUMN canceled_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meetings' AND column_name='cancel_reason') THEN
        ALTER TABLE public.meetings ADD COLUMN cancel_reason TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meetings' AND column_name='completed_at') THEN
        ALTER TABLE public.meetings ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meetings' AND column_name='completed_by') THEN
        ALTER TABLE public.meetings ADD COLUMN completed_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create meeting_status_history table
CREATE TABLE IF NOT EXISTS public.meeting_status_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT ON public.meeting_status_history TO authenticated;
GRANT ALL ON public.meeting_status_history TO service_role;

-- Enable RLS
ALTER TABLE public.meeting_status_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view history of meetings they have access to" 
ON public.meeting_status_history 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.meetings m 
        WHERE m.id = meeting_id 
        AND (
            m.consultant_id = auth.uid() OR 
            m.client_id IN (SELECT id FROM public.clients WHERE id = m.client_id)
            OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'admin')
        )
    )
);

CREATE POLICY "Authenticated users can insert status history" 
ON public.meeting_status_history 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);
