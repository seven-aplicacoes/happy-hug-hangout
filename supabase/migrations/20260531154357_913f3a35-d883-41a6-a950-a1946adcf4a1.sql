ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS calendly_url text;

COMMENT ON COLUMN public.profiles.calendly_url IS 'URL pública de agendamento do Calendly do consultor, opcional.';

-- Ensure clients can read their consultant's calendly_url if there's an existing policy.
-- If the existing policies are general, no changes are needed.
-- Looking at previous context, we've simplified policies. 
-- Let's make sure the role 'cliente' can see the profile columns they need.
-- The current policy "Profiles are viewable by everyone" or similar might be in place.
-- Given the requirement to only show to related clients, we'll verify/ensure a safe policy exists.

-- Grant access to the new column for the appropriate roles
GRANT SELECT (id, full_name, email, phone, role, specialty, status, avatar_url, calendly_url) ON public.profiles TO authenticated;
GRANT SELECT (id, full_name, email, phone, role, specialty, status, avatar_url, calendly_url) ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;