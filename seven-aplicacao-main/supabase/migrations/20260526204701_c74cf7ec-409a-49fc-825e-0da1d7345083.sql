-- Create consultant_permissions table
CREATE TABLE public.consultant_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    consultant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_key TEXT NOT NULL,
    module_name TEXT NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT true,
    can_create BOOLEAN NOT NULL DEFAULT false,
    can_edit BOOLEAN NOT NULL DEFAULT false,
    can_delete BOOLEAN NOT NULL DEFAULT false,
    can_export BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    UNIQUE(consultant_id, module_key)
);

-- Use GRANT to set permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultant_permissions TO authenticated;
GRANT ALL ON public.consultant_permissions TO service_role;

-- Enable Row Level Security
ALTER TABLE public.consultant_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can do everything on consultant_permissions"
ON public.consultant_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Consultants can view their own permissions"
ON public.consultant_permissions
FOR SELECT
TO authenticated
USING (
  auth.uid() = consultant_id
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_consultant_permissions_updated_at
BEFORE UPDATE ON public.consultant_permissions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Function to seed default permissions for a consultant
CREATE OR REPLACE FUNCTION public.seed_default_consultant_permissions(p_consultant_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.consultant_permissions (consultant_id, module_key, module_name, can_view, can_create, can_edit, can_delete, can_export)
  VALUES
    (p_consultant_id, 'dashboard', 'Dashboard do Consultor', true, false, false, false, false),
    (p_consultant_id, 'clientes', 'Meus Clientes', true, false, false, false, false),
    (p_consultant_id, 'ficha_cliente', 'Ficha do Cliente', true, false, true, false, false),
    (p_consultant_id, 'reunioes', 'Minhas Reuniões', true, true, true, true, false),
    (p_consultant_id, 'tarefas', 'Minhas Tarefas', true, true, true, true, false),
    (p_consultant_id, 'documentos', 'Documentos', true, true, true, true, true),
    (p_consultant_id, 'metodologia', 'Metodologia Seven', true, false, false, false, false),
    (p_consultant_id, 'indicadores', 'Indicadores', true, false, true, false, false),
    (p_consultant_id, 'perfil', 'Meu Perfil', true, false, true, false, false)
  ON CONFLICT (consultant_id, module_key) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
