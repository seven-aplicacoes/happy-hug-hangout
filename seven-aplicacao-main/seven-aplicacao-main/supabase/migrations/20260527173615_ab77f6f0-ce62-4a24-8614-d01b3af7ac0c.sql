-- Step 1: Update existing data to be numeric-compatible
UPDATE public.products SET 
  consultant_hours = CASE 
    WHEN consultant_hours ILIKE '60%' THEN '60'
    WHEN consultant_hours ILIKE '10%' THEN '10'
    WHEN consultant_hours ILIKE '5%' THEN '5'
    WHEN consultant_hours ILIKE '20%' THEN '20'
    WHEN consultant_hours ILIKE '30%' THEN '30'
    WHEN consultant_hours ILIKE '15%' THEN '15'
    WHEN consultant_hours ILIKE '24%' THEN '24'
    ELSE REGEXP_REPLACE(consultant_hours, '[^0-9.]', '', 'g')
  END,
  silvane_hours = CASE 
    WHEN silvane_hours ILIKE '%4:30%' THEN '4.5'
    WHEN silvane_hours ILIKE '30%' THEN '30'
    ELSE REGEXP_REPLACE(silvane_hours, '[^0-9.]', '', 'g')
  END;

-- Step 2: Handle empty strings resulting from regex (if any) by setting them to NULL
UPDATE public.products SET consultant_hours = NULL WHERE consultant_hours = '';
UPDATE public.products SET silvane_hours = NULL WHERE silvane_hours = '';

-- Step 3: Change column types to NUMERIC
ALTER TABLE public.products 
  ALTER COLUMN consultant_hours TYPE NUMERIC USING consultant_hours::NUMERIC,
  ALTER COLUMN silvane_hours TYPE NUMERIC USING silvane_hours::NUMERIC;
