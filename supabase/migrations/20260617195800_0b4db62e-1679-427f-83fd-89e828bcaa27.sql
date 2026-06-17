CREATE TABLE public.client_onedrive_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  category text,
  description text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_onedrive_links TO authenticated;
GRANT ALL ON public.client_onedrive_links TO service_role;

ALTER TABLE public.client_onedrive_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all onedrive links"
  ON public.client_onedrive_links FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Consultants view onedrive links of their clients"
  ON public.client_onedrive_links FOR SELECT
  TO authenticated
  USING (public.check_consultant_client_access(client_id));

CREATE POLICY "Consultants insert onedrive links for their clients"
  ON public.client_onedrive_links FOR INSERT
  TO authenticated
  WITH CHECK (public.check_consultant_client_access(client_id));

CREATE POLICY "Consultants update onedrive links of their clients"
  ON public.client_onedrive_links FOR UPDATE
  TO authenticated
  USING (public.check_consultant_client_access(client_id))
  WITH CHECK (public.check_consultant_client_access(client_id));

CREATE POLICY "Consultants delete onedrive links of their clients"
  ON public.client_onedrive_links FOR DELETE
  TO authenticated
  USING (public.check_consultant_client_access(client_id));

CREATE INDEX idx_client_onedrive_links_client ON public.client_onedrive_links(client_id);

CREATE TRIGGER set_client_onedrive_links_updated_at
  BEFORE UPDATE ON public.client_onedrive_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for documents bucket: allow consultants with client access to upload/read/delete
CREATE POLICY "Admins manage documents storage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'documents' AND public.is_admin())
  WITH CHECK (bucket_id = 'documents' AND public.is_admin());

CREATE POLICY "Consultants read documents storage"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.is_consultant()
  );

CREATE POLICY "Consultants upload documents storage"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND public.is_consultant()
  );

CREATE POLICY "Consultants delete own documents storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND owner = auth.uid()
  );
