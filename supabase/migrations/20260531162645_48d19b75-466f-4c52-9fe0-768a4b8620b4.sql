ALTER TABLE public.contract_module_meetings 
ADD COLUMN IF NOT EXISTS cancel_url TEXT,
ADD COLUMN IF NOT EXISTS reschedule_url TEXT;
