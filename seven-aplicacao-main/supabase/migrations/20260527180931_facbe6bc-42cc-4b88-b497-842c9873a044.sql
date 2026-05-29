-- Update existing data to minutes before changing type
UPDATE public.products 
SET 
  consultant_hours = ROUND(consultant_hours * 60),
  silvane_hours = ROUND(silvane_hours * 60);

-- Change column types to integer
ALTER TABLE public.products 
  ALTER COLUMN consultant_hours TYPE integer USING consultant_hours::integer,
  ALTER COLUMN silvane_hours TYPE integer USING silvane_hours::integer;
