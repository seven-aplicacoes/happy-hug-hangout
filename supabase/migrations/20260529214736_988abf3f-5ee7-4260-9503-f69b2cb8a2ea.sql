-- Create meeting_csat_responses table
CREATE TABLE public.meeting_csat_responses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    consultant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rating_meeting INTEGER CHECK (rating_meeting >= 1 AND rating_meeting <= 5),
    rating_clarity INTEGER CHECK (rating_clarity >= 1 AND rating_clarity <= 5),
    rating_consultant INTEGER CHECK (rating_consultant >= 1 AND rating_consultant <= 5),
    nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
    comment TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add CSAT columns to meetings
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS csat_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS csat_submitted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS csat_submitted_at TIMESTAMP WITH TIME ZONE;

-- Grant permissions
GRANT SELECT, INSERT ON public.meeting_csat_responses TO authenticated;
GRANT ALL ON public.meeting_csat_responses TO service_role;

-- Enable RLS
ALTER TABLE public.meeting_csat_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for meeting_csat_responses
CREATE POLICY "Users can view their own csat responses" 
ON public.meeting_csat_responses 
FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'consultor'))
  OR 
  client_id IN (SELECT id FROM public.clients WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

CREATE POLICY "Clients can create their own csat responses" 
ON public.meeting_csat_responses 
FOR INSERT 
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_csat_meeting_id ON public.meeting_csat_responses(meeting_id);
CREATE INDEX IF NOT EXISTS idx_csat_client_id ON public.meeting_csat_responses(client_id);
CREATE INDEX IF NOT EXISTS idx_csat_contract_id ON public.meeting_csat_responses(contract_id);
