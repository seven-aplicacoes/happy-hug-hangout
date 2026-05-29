UPDATE public.tasks 
SET status = 'a_fazer' 
WHERE status::text IN ('A Fazer', 'A fazer', 'a fazer', 'PENDENTE', 'pendente');

UPDATE public.tasks 
SET status = 'em_andamento' 
WHERE status::text IN ('Em Andamento', 'em andamento', 'ANDAMENTO');

UPDATE public.tasks 
SET status = 'concluida' 
WHERE status::text IN ('Concluída', 'Concluida', 'concluída', 'CONCLUIDA', 'finalizada');

UPDATE public.tasks 
SET status = 'atrasada' 
WHERE status::text IN ('Atrasada', 'ATRASADA', 'vencida');

UPDATE public.tasks 
SET status = 'impedida' 
WHERE status::text IN ('Impedida', 'IMPEDIDA', 'bloqueada');