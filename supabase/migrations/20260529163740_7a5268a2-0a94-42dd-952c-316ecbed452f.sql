-- 1. Adjust methodology_phases
ALTER TABLE public.methodology_phases 
ADD COLUMN IF NOT EXISTS subtitle TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Create detailed tables (migrating from arrays later if needed, but starting fresh structure)
CREATE TABLE IF NOT EXISTS public.methodology_phase_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id UUID NOT NULL REFERENCES public.methodology_phases(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.methodology_phase_deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id UUID NOT NULL REFERENCES public.methodology_phases(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.methodology_phase_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id UUID NOT NULL REFERENCES public.methodology_phases(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Adjust methodology_materials for file tracking
ALTER TABLE public.methodology_materials 
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS is_essential BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_updated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 4. Create methodology_transversal_materials
CREATE TABLE IF NOT EXISTS public.methodology_transversal_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    file_name TEXT,
    file_url TEXT,
    file_path TEXT,
    file_type TEXT,
    file_size BIGINT,
    is_preview BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    order_index INTEGER DEFAULT 0,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Security & RLS
ALTER TABLE public.methodology_phase_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.methodology_phase_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.methodology_phase_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.methodology_transversal_materials ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.methodology_phase_objectives TO authenticated;
GRANT ALL ON public.methodology_phase_deliverables TO authenticated;
GRANT ALL ON public.methodology_phase_tools TO authenticated;
GRANT ALL ON public.methodology_transversal_materials TO authenticated;

GRANT ALL ON public.methodology_phase_objectives TO service_role;
GRANT ALL ON public.methodology_phase_deliverables TO service_role;
GRANT ALL ON public.methodology_phase_tools TO service_role;
GRANT ALL ON public.methodology_transversal_materials TO service_role;

-- Policies for Admin (Assuming 'profiles' has 'role')
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin manage objectives') THEN
        CREATE POLICY "Admin manage objectives" ON public.methodology_phase_objectives FOR ALL TO authenticated 
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin manage deliverables') THEN
        CREATE POLICY "Admin manage deliverables" ON public.methodology_phase_deliverables FOR ALL TO authenticated 
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin manage transversal') THEN
        CREATE POLICY "Admin manage transversal" ON public.methodology_transversal_materials FOR ALL TO authenticated 
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

-- Consultor Read Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read objectives') THEN
        CREATE POLICY "Anyone can read objectives" ON public.methodology_phase_objectives FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read deliverables') THEN
        CREATE POLICY "Anyone can read deliverables" ON public.methodology_phase_deliverables FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read transversal') THEN
        CREATE POLICY "Anyone can read transversal" ON public.methodology_transversal_materials FOR SELECT TO authenticated USING (status = 'active');
    END IF;
END $$;

-- 6. Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('methodology-materials', 'methodology-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can upload materials' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Admin can upload materials" ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'methodology-materials' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can delete materials' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Admin can delete materials" ON storage.objects FOR DELETE TO authenticated
        USING (bucket_id = 'methodology-materials' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view materials' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Anyone can view materials" ON storage.objects FOR SELECT TO authenticated
        USING (bucket_id = 'methodology-materials');
    END IF;
END $$;
