-- Create meeting_minutes table
CREATE TABLE public.meeting_minutes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    summary TEXT,
    discussion_points TEXT,
    decisions TEXT,
    next_steps TEXT,
    internal_notes TEXT,
    visible_to_client BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Use GRANT to set permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_minutes TO authenticated;
GRANT ALL ON public.meeting_minutes TO service_role;

-- Enable Row Level Security
ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Minutes are viewable by assigned consultant and admins" 
ON public.meeting_minutes 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.meetings m 
        WHERE m.id = meeting_minutes.meeting_id 
        AND (m.consultant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
    )
    OR 
    (visible_to_client = TRUE AND EXISTS (
        SELECT 1 FROM public.meetings m 
        WHERE m.id = meeting_minutes.meeting_id 
        AND m.client_id = auth.uid()
    ))
);

CREATE POLICY "Consultants can create minutes for their meetings" 
ON public.meeting_minutes 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.meetings m 
        WHERE m.id = meeting_id 
        AND (m.consultant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
    )
);

CREATE POLICY "Consultants can update their own minutes" 
ON public.meeting_minutes 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.meetings m 
        WHERE m.id = meeting_id 
        AND (m.consultant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_meeting_minutes_updated_at
BEFORE UPDATE ON public.meeting_minutes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
