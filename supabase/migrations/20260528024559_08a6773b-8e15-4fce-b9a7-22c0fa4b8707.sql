-- Adiciona a coluna company_size à tabela clients
ALTER TABLE public.clients ADD COLUMN company_size TEXT;

-- Comentário para documentar o propósito da coluna
COMMENT ON COLUMN public.clients.company_size IS 'Porte da empresa (MEI, Micro, Pequena, Média, Grande)';
