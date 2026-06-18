
CREATE TABLE IF NOT EXISTS public.client_profile_section_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  section_label text NOT NULL,
  display_order integer NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.client_profile_section_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_profile_section_settings TO authenticated;
GRANT ALL ON public.client_profile_section_settings TO service_role;

ALTER TABLE public.client_profile_section_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read section settings"
  ON public.client_profile_section_settings
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Only admins can modify section settings"
  ON public.client_profile_section_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_client_profile_section_settings_updated_at
  BEFORE UPDATE ON public.client_profile_section_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.client_profile_section_settings (section_key, section_label, display_order)
VALUES
  ('ficha_cadastral', 'Ficha Cadastral', 1),
  ('contratos_jornada', 'Contratos e Jornada', 2),
  ('tarefas_cliente', 'Tarefas do Cliente', 3),
  ('onedrive_cliente', 'OneDrive do Cliente', 4)
ON CONFLICT (section_key) DO NOTHING;
