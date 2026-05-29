-- 1. Ensure columns exist before dropping legacy ones
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS contract_product_id UUID REFERENCES public.contract_products(id);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS contract_product_id UUID REFERENCES public.contract_products(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS contract_product_id UUID REFERENCES public.contract_products(id);

-- 2. Drop dependent policies
DROP POLICY IF EXISTS "Consultants can view relevant documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can manage client_contacts" ON public.client_contacts;
DROP POLICY IF EXISTS "Consultants can view their clients contacts" ON public.client_contacts;
DROP POLICY IF EXISTS "Admins can manage contract_products" ON public.contract_products;
DROP POLICY IF EXISTS "Consultants can view their clients contract products" ON public.contract_products;

-- 3. Final structural cleanup (CASCADING to remove dependencies)
ALTER TABLE public.meetings DROP COLUMN IF EXISTS project_id CASCADE;
ALTER TABLE public.meetings DROP COLUMN IF EXISTS client_product_id CASCADE;
ALTER TABLE public.documents DROP COLUMN IF EXISTS project_id CASCADE;
ALTER TABLE public.documents DROP COLUMN IF EXISTS client_product_id CASCADE;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS project_id CASCADE;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS client_product_id CASCADE;

-- 4. Re-create policies with new names and structure
CREATE POLICY "Admins can manage client_contacts" ON public.client_contacts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Consultants can view their clients contacts" ON public.client_contacts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.clients WHERE id = client_contacts.client_id AND consultant_id = auth.uid()));

CREATE POLICY "Admins can manage contract_products" ON public.contract_products FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Consultants can view their clients contract products" ON public.contract_products FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.contracts c JOIN public.clients cl ON c.client_id = cl.id WHERE c.id = contract_products.contract_id AND cl.consultant_id = auth.uid()));

CREATE POLICY "Consultants can view relevant documents" ON public.documents 
FOR SELECT TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = documents.client_id AND c.consultant_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.contract_products cp JOIN public.contracts ct ON cp.contract_id = ct.id JOIN public.clients c ON ct.client_id = c.id WHERE cp.id = documents.contract_product_id AND c.consultant_id = auth.uid())
);
