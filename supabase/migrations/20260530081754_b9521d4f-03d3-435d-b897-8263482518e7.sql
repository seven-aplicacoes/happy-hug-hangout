-- Consultant availability management

-- Table for availability rules (recurring)
CREATE TABLE public.consultant_availability (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
    contract_product_id UUID REFERENCES public.contract_products(id) ON DELETE CASCADE,
    contract_phase_id UUID REFERENCES public.contract_product_phases(id) ON DELETE CASCADE,
    consultant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6), -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for generated slots
CREATE TABLE public.consultant_available_slots (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
    contract_product_id UUID REFERENCES public.contract_products(id) ON DELETE CASCADE,
    contract_phase_id UUID REFERENCES public.contract_product_phases(id) ON DELETE CASCADE,
    consultant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_booked BOOLEAN NOT NULL DEFAULT false,
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_consultant_availability_lookup ON public.consultant_availability(consultant_id, client_id, contract_phase_id);
CREATE INDEX idx_consultant_available_slots_lookup ON public.consultant_available_slots(consultant_id, available_date, is_booked);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultant_availability TO authenticated;
GRANT ALL ON public.consultant_availability TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultant_available_slots TO authenticated;
GRANT ALL ON public.consultant_available_slots TO service_role;

-- Enable RLS
ALTER TABLE public.consultant_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_available_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consultant_availability
CREATE POLICY "Admins can manage all availability"
ON public.consultant_availability
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Consultants can manage their own availability"
ON public.consultant_availability
FOR ALL
TO authenticated
USING (
  consultant_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Clients can view availability for their modules"
ON public.consultant_availability
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = consultant_availability.client_id
    AND clients.auth_user_id = auth.uid()
  )
);

-- RLS Policies for consultant_available_slots
CREATE POLICY "Admins can manage all slots"
ON public.consultant_available_slots
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Consultants can manage their own slots"
ON public.consultant_available_slots
FOR ALL
TO authenticated
USING (
  consultant_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Clients can view available slots for their modules"
ON public.consultant_available_slots
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = consultant_available_slots.client_id
    AND clients.auth_user_id = auth.uid()
  )
);

-- Update trigger for updated_at
CREATE TRIGGER update_consultant_availability_updated_at
BEFORE UPDATE ON public.consultant_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultant_available_slots_updated_at
BEFORE UPDATE ON public.consultant_available_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
