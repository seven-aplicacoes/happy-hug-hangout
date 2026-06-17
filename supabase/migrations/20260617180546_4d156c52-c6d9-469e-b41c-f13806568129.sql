CREATE POLICY "profiles_select_authenticated_basic"
ON public.profiles FOR SELECT
TO authenticated
USING (true);