-- Fix consultant_availability constraint
ALTER TABLE public.consultant_availability 
DROP CONSTRAINT IF EXISTS consultant_availability_contract_module_meeting_id_fkey;

ALTER TABLE public.consultant_availability 
ADD CONSTRAINT consultant_availability_contract_module_meeting_id_fkey 
FOREIGN KEY (contract_module_meeting_id) 
REFERENCES public.contract_module_meetings(id) 
ON DELETE CASCADE;

-- Fix meeting_scheduling_events constraint
ALTER TABLE public.meeting_scheduling_events 
DROP CONSTRAINT IF EXISTS meeting_scheduling_events_meeting_id_fkey;

ALTER TABLE public.meeting_scheduling_events 
ADD CONSTRAINT meeting_scheduling_events_meeting_id_fkey 
FOREIGN KEY (meeting_id) 
REFERENCES public.contract_module_meetings(id) 
ON DELETE CASCADE;

-- Fix consultant_available_slots constraint
ALTER TABLE public.consultant_available_slots 
DROP CONSTRAINT IF EXISTS consultant_available_slots_contract_module_meeting_id_fkey;

ALTER TABLE public.consultant_available_slots 
ADD CONSTRAINT consultant_available_slots_contract_module_meeting_id_fkey 
FOREIGN KEY (contract_module_meeting_id) 
REFERENCES public.contract_module_meetings(id) 
ON DELETE CASCADE;

-- Fix meeting_csat constraint
ALTER TABLE public.meeting_csat 
DROP CONSTRAINT IF EXISTS meeting_csat_contract_module_meeting_id_fkey;

ALTER TABLE public.meeting_csat 
ADD CONSTRAINT meeting_csat_contract_module_meeting_id_fkey 
FOREIGN KEY (contract_module_meeting_id) 
REFERENCES public.contract_module_meetings(id) 
ON DELETE CASCADE;

-- Fix meetings constraint
ALTER TABLE public.meetings 
DROP CONSTRAINT IF EXISTS meetings_contract_module_meeting_id_fkey;

ALTER TABLE public.meetings 
ADD CONSTRAINT meetings_contract_module_meeting_id_fkey 
FOREIGN KEY (contract_module_meeting_id) 
REFERENCES public.contract_module_meetings(id) 
ON DELETE CASCADE;

-- Fix meeting_history_events constraint
ALTER TABLE public.meeting_history_events 
DROP CONSTRAINT IF EXISTS meeting_history_events_meeting_id_fkey;

ALTER TABLE public.meeting_history_events 
ADD CONSTRAINT meeting_history_events_meeting_id_fkey 
FOREIGN KEY (meeting_id) 
REFERENCES public.contract_module_meetings(id) 
ON DELETE CASCADE;
