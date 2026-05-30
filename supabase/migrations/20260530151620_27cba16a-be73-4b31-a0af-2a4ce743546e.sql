CREATE TABLE IF NOT EXISTS public.consultant_calendly_event_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    consultant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    calendly_event_type_uri TEXT NOT NULL UNIQUE,
    calendly_scheduling_url TEXT NOT NULL,
    name TEXT NOT NULL,
    duration INTEGER,
    active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_consultant_calendly_event_types_consultant ON public.consultant_calendly_event_types(consultant_id);

-- Add column to integrations for sync tracking
ALTER TABLE public.consultant_calendar_integrations 
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultant_calendly_event_types TO authenticated;
GRANT ALL ON public.consultant_calendly_event_types TO service_role;

-- RLS
ALTER TABLE public.consultant_calendly_event_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calendly event types" 
ON public.consultant_calendly_event_types 
FOR SELECT 
USING (auth.uid() = consultant_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Consultants can manage their own event types" 
ON public.consultant_calendly_event_types 
FOR ALL 
USING (auth.uid() = consultant_id);

-- Trigger for updated_at
CREATE TRIGGER update_consultant_calendly_event_types_updated_at
BEFORE UPDATE ON public.consultant_calendly_event_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
