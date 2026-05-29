-- Add capacity columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS max_clients INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS hours_available INTEGER DEFAULT 160;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
