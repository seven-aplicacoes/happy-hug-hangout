-- Create methodology_notes table
CREATE TABLE IF NOT EXISTS public.methodology_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('observacao', 'pendencia', 'decisao_futura', 'risco', 'pergunta', 'ideia')),
    status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_discussao', 'aprovado', 'descartado', 'resolvido')),
    priority TEXT DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
    related_area TEXT CHECK (related_area IN ('metodologia_geral', 'materiais', 'templates', 'perguntas', 'alertas', 'conteudo_cliente', 'conteudo_consultor', 'governanca')),
    related_phase_id UUID REFERENCES public.methodology_phases(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.methodology_notes TO authenticated;
GRANT ALL ON public.methodology_notes TO service_role;

-- Enable RLS
ALTER TABLE public.methodology_notes ENABLE ROW LEVEL SECURITY;

-- Policies for Admins (Assuming they have 'admin' profile role)
-- We'll use a subquery or check for 'admin' role in profiles
CREATE POLICY "Admins can manage methodology notes"
ON public.methodology_notes
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Policies for Consultants (Read-only)
CREATE POLICY "Consultants can view methodology notes"
ON public.methodology_notes
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'consultor'
    )
);

-- No policies for clients, meaning no access

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_methodology_notes_type ON public.methodology_notes(type);
CREATE INDEX IF NOT EXISTS idx_methodology_notes_status ON public.methodology_notes(status);
CREATE INDEX IF NOT EXISTS idx_methodology_notes_priority ON public.methodology_notes(priority);
CREATE INDEX IF NOT EXISTS idx_methodology_notes_phase ON public.methodology_notes(related_phase_id);

-- Updated at trigger
CREATE TRIGGER update_methodology_notes_updated_at
BEFORE UPDATE ON public.methodology_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
