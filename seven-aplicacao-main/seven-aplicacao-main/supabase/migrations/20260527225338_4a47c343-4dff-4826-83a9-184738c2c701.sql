UPDATE public.tasks 
SET status = 'a_fazer' 
WHERE status::text IN ('atrasada', 'atrasado', 'vencida');