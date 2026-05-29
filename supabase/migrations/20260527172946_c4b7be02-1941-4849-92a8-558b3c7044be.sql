-- Add columns for hours
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS consultant_hours TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS silvane_hours TEXT;

-- Insert initial products
INSERT INTO public.products (name, consultant_hours, silvane_hours, status)
VALUES 
('Signature 2.0 com GB', '60h', NULL, 'active'),
('Seven select', '10h', NULL, 'active'),
('Planejamento Estratégico', '5h', '3 encontros 4:30', 'active'),
('Moldular', '20h', NULL, 'active'),
('Signature 2.0 + PE + GB', '60H', '3 encontros 4:30', 'active'),
('Signature 2.0 quinzenal + GB', '30h', NULL, 'active'),
('Signature 2.0 quinzenal + PE + GB', '30h', '3 encontros 4:30', 'active'),
('Signature 6 meses', '60h', NULL, 'active'),
('Estudo de viabilidade', '5h', '3 encontros 4:30', 'active'),
('Signature 1.0', '15h', NULL, 'active'),
('Conselho', '24h', '30h', 'active')
ON CONFLICT (id) DO NOTHING;
