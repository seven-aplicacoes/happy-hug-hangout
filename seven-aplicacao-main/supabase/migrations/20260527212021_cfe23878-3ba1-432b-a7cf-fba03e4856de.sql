-- 1. Atualizar a tabela documents com novos campos de metadados
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Criar o bucket documents se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de RLS para a tabela public.documents (Revisão/Reforço)
-- Remover políticas antigas se necessário para evitar conflitos (opcional, mas seguro)
-- DROP POLICY IF EXISTS "Admins have total access on documents" ON public.documents;
-- DROP POLICY IF EXISTS "Consultants view their clients documents" ON public.documents;
-- DROP POLICY IF EXISTS "Clients view their own documents" ON public.documents;

-- Nota: Assumindo que RLS já está habilitado na tabela documents.
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Política para Admin
CREATE POLICY "Admins total access" 
ON public.documents 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Política para Consultor
CREATE POLICY "Consultants access their clients documents" 
ON public.documents 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'consultor' 
    AND (
      public.documents.client_id IN (SELECT id FROM public.clients WHERE consultant_id = auth.uid())
      OR public.documents.author_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'consultor' 
    AND (
      public.documents.client_id IN (SELECT id FROM public.clients WHERE consultant_id = auth.uid())
      OR public.documents.author_id = auth.uid()
    )
  )
);

-- Política para Cliente
CREATE POLICY "Clients view their own documents" 
ON public.documents 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'cliente' 
    AND public.documents.client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
    AND public.documents.visibility IN ('client', 'all')
  )
);

-- 4. Políticas de Storage para o bucket documents
-- Habilitar RLS no storage.objects (Geralmente já habilitado no Supabase)

-- Política de Select para Storage
CREATE POLICY "Storage Select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND (
    -- Admin
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Consultor: pode ler se for o consultor do cliente (segmento 1 do path)
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'consultor'
      AND EXISTS (
        SELECT 1 FROM public.clients 
        WHERE id::text = (storage.foldername(name))[1] 
        AND consultant_id = auth.uid()
      )
    )
    OR
    -- Cliente: pode ler se for o cliente (segmento 1) e o documento (segmento 3) tiver visibilidade permitida
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'cliente'
      AND EXISTS (
        SELECT 1 FROM public.clients 
        WHERE id::text = (storage.foldername(name))[1] 
        AND auth_user_id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM public.documents
        WHERE id::text = (storage.foldername(name))[3]
        AND visibility IN ('client', 'all')
      )
    )
  )
);

-- Política de Insert para Storage
CREATE POLICY "Storage Insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND (
    -- Admin
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Consultor: pode inserir se for o consultor do cliente
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'consultor'
      AND EXISTS (
        SELECT 1 FROM public.clients 
        WHERE id::text = (storage.foldername(name))[1] 
        AND consultant_id = auth.uid()
      )
    )
  )
);

-- Política de Update para Storage
CREATE POLICY "Storage Update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND (
    -- Admin
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Consultor
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'consultor'
      AND EXISTS (
        SELECT 1 FROM public.clients 
        WHERE id::text = (storage.foldername(name))[1] 
        AND consultant_id = auth.uid()
      )
    )
  )
);

-- Política de Delete para Storage
CREATE POLICY "Storage Delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND (
    -- Admin
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Consultor
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'consultor'
      AND EXISTS (
        SELECT 1 FROM public.clients 
        WHERE id::text = (storage.foldername(name))[1] 
        AND consultant_id = auth.uid()
      )
    )
  )
);
