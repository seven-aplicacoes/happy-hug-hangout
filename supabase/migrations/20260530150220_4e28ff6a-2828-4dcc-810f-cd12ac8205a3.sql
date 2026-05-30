-- Add Calendly related fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS calendly_user_uri TEXT,
ADD COLUMN IF NOT EXISTS calendly_event_type_uri TEXT,
ADD COLUMN IF NOT EXISTS calendly_scheduling_url TEXT,
ADD COLUMN IF NOT EXISTS calendly_connected BOOLEAN DEFAULT false;

-- Create calendly_booking_sessions table
CREATE TABLE IF NOT EXISTS public.calendly_booking_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_token TEXT NOT NULL UNIQUE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
    contract_product_id UUID REFERENCES public.contract_products(id) ON DELETE CASCADE,
    contract_phase_id UUID REFERENCES public.contract_product_phases(id) ON DELETE CASCADE,
    contract_module_meeting_id UUID REFERENCES public.contract_module_meetings(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '2 hours')
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendly_booking_sessions TO authenticated;
GRANT ALL ON public.calendly_booking_sessions TO service_role;

-- RLS
ALTER TABLE public.calendly_booking_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for calendly_booking_sessions
-- For consultants or admins
CREATE POLICY "Users can view their own booking sessions" 
ON public.calendly_booking_sessions 
FOR SELECT 
USING (auth.uid() = consultant_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- For clients
CREATE POLICY "Clients can view their own booking sessions" 
ON public.calendly_booking_sessions 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND client_id = calendly_booking_sessions.client_id
));

-- Allow insertion
CREATE POLICY "Allow insertion of booking sessions by authenticated users" 
ON public.calendly_booking_sessions 
FOR INSERT 
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendly_booking_sessions_token ON public.calendly_booking_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_calendly_booking_sessions_client ON public.calendly_booking_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_calendly_booking_sessions_consultant ON public.calendly_booking_sessions(consultant_id);

-- Update meetings table with Calendly fields
ALTER TABLE public.meetings
ADD COLUMN IF NOT EXISTS external_provider TEXT,
ADD COLUMN IF NOT EXISTS calendly_event_uri TEXT,
ADD COLUMN IF NOT EXISTS calendly_invitee_uri TEXT,
ADD COLUMN IF NOT EXISTS calendly_event_type_uri TEXT,
ADD COLUMN IF NOT EXISTS calendly_cancel_url TEXT,
ADD COLUMN IF NOT EXISTS calendly_reschedule_url TEXT,
ADD COLUMN IF NOT EXISTS external_payload JSONB;
