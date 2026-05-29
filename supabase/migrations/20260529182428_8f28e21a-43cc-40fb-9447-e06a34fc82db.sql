-- Alter consultant_indicator_goals to match new requirements
ALTER TABLE public.consultant_indicator_goals 
ADD COLUMN IF NOT EXISTS is_per_client BOOLEAN DEFAULT false;

-- Ensure period_type is present and clean it (it should only be 'weekly' or 'monthly')
-- If it's something else, default to 'monthly'
UPDATE public.consultant_indicator_goals 
SET period_type = 'monthly' 
WHERE period_type NOT IN ('weekly', 'monthly') OR period_type IS NULL;

-- Remove indicators that are not in the allowed 6
DELETE FROM public.consultant_indicator_goals 
WHERE indicator_key NOT IN (
  'meetings_completed',
  'csat_responses',
  'csat_adherence',
  'csat_score',
  'nps',
  'meetings_per_client'
);

-- Ensure unique constraint for consultant_id and indicator_key
ALTER TABLE public.consultant_indicator_goals 
DROP CONSTRAINT IF EXISTS consultant_indicator_goals_consultant_id_indicator_key_key;

ALTER TABLE public.consultant_indicator_goals 
ADD CONSTRAINT consultant_indicator_goals_consultant_id_indicator_key_key 
UNIQUE (consultant_id, indicator_key);

-- Function to seed default goals for a consultant
CREATE OR REPLACE FUNCTION public.seed_consultant_goals(c_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.consultant_indicator_goals 
    (consultant_id, indicator_key, indicator_label, goal_value, goal_type, comparison_operator, period_type, is_active, is_per_client)
  VALUES 
    (c_id, 'meetings_completed', 'Reuniões Realizadas', 20, 'minimum', 'greater_or_equal', 'monthly', true, false),
    (c_id, 'csat_responses', 'CSAT Respostas', 10, 'minimum', 'greater_or_equal', 'monthly', true, false),
    (c_id, 'csat_adherence', 'Adesão CSAT', 80, 'minimum', 'greater_or_equal', 'monthly', true, false),
    (c_id, 'csat_score', 'Nota CSAT', 4.5, 'minimum', 'greater_or_equal', 'monthly', true, false),
    (c_id, 'nps', 'NPS', 70, 'minimum', 'greater_or_equal', 'monthly', true, false),
    (c_id, 'meetings_per_client', 'Encontros por Cliente', 2, 'minimum', 'greater_or_equal', 'monthly', true, true)
  ON CONFLICT (consultant_id, indicator_key) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to seed goals when a new profile is created with consultant role
CREATE OR REPLACE FUNCTION public.on_consultant_created_seed_goals()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'consultor' THEN
    PERFORM public.seed_consultant_goals(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_seed_consultant_goals ON public.profiles;
CREATE TRIGGER tr_seed_consultant_goals
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.on_consultant_created_seed_goals();

-- Seed existing consultants
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.profiles WHERE role = 'consultor'
    LOOP
        PERFORM public.seed_consultant_goals(r.id);
    END LOOP;
END $$;
