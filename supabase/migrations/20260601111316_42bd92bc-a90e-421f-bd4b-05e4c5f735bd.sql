-- Move auth_user_id from deleted client to active client for Orbi
UPDATE public.clients
SET auth_user_id = '64feab48-9a68-4530-85e6-71f727daf52d',
    portal_access_enabled = true,
    status = 'ativo',
    email = 'orbi@seven.com'
WHERE id = 'a6ffe743-f983-4d09-9518-e4bc31d03fdf';

-- Remove auth_user_id from the deleted client to avoid conflicts
UPDATE public.clients
SET auth_user_id = NULL
WHERE id = '0dd4d273-d351-4555-acda-79ab005eb587';
