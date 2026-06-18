CREATE TABLE public.user_client_page_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  section_order jsonb NOT NULL DEFAULT '["ficha_cadastral","contratos_jornada","tarefas_cliente","onedrive_cliente"]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_client_page_preferences TO authenticated;
GRANT ALL ON public.user_client_page_preferences TO service_role;

ALTER TABLE public.user_client_page_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own client page prefs"
ON public.user_client_page_preferences
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_client_page_preferences_updated_at
BEFORE UPDATE ON public.user_client_page_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();