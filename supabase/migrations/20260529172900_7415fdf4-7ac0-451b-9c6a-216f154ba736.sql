-- Create consultant_kpi_targets table
CREATE TABLE public.consultant_kpi_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    kpi_key TEXT NOT NULL,
    target_value NUMERIC NOT NULL,
    target_unit TEXT,
    comparison_operator TEXT NOT NULL DEFAULT 'gte',
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Index for performance
CREATE INDEX idx_consultant_kpi_targets_consultant_id ON public.consultant_kpi_targets(consultant_id);
CREATE UNIQUE INDEX idx_consultant_kpi_targets_consultant_key ON public.consultant_kpi_targets(consultant_id, kpi_key);

-- Enable RLS
ALTER TABLE public.consultant_kpi_targets ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultant_kpi_targets TO authenticated;
GRANT ALL ON public.consultant_kpi_targets TO service_role;

-- Policies
CREATE POLICY "Admins can manage all KPI targets"
ON public.consultant_kpi_targets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Consultants can view their own KPI targets"
ON public.consultant_kpi_targets
FOR SELECT
USING (consultant_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_consultant_kpi_targets_updated_at
BEFORE UPDATE ON public.consultant_kpi_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();