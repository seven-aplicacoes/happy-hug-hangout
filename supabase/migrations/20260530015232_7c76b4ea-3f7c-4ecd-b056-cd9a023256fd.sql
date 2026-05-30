-- Add deleted_at column for soft delete
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policies to exclude deleted clients for regular users
-- We'll just rely on the application layer for now to be safe, 
-- but ensuring the column exists is the first step.
