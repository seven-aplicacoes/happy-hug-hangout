UPDATE public.documents d
SET client_product_id = cp.id
FROM public.client_products cp
WHERE d.project_id = cp.legacy_project_id
AND d.client_product_id IS NULL;