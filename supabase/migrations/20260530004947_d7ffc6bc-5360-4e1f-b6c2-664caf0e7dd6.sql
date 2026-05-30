-- Grant access to authenticated users
GRANT SELECT ON public.clients TO authenticated;
GRANT SELECT ON public.contracts TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.contract_products TO authenticated;
GRANT SELECT ON public.contract_product_phases TO authenticated;
GRANT SELECT ON public.contract_module_meetings TO authenticated;
GRANT SELECT ON public.documents TO authenticated;
GRANT SELECT ON public.timeline_events TO authenticated;
GRANT SELECT ON public.meeting_csat_responses TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- Ensure service_role has full access
GRANT ALL ON public.clients TO service_role;
GRANT ALL ON public.contracts TO service_role;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.contract_products TO service_role;
GRANT ALL ON public.contract_product_phases TO service_role;
GRANT ALL ON public.contract_module_meetings TO service_role;
GRANT ALL ON public.documents TO service_role;
GRANT ALL ON public.timeline_events TO service_role;
GRANT ALL ON public.meeting_csat_responses TO service_role;
GRANT ALL ON public.profiles TO service_role;

-- Grant usage on sequences if any (though usually not needed for SELECT)
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
