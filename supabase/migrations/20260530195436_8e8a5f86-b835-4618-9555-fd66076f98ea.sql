-- 1. Remover tabelas extras que não estão no código atual
DROP TABLE IF EXISTS public.calendly_booking_sessions CASCADE;
DROP TABLE IF EXISTS public.consultant_calendly_settings CASCADE;
DROP TABLE IF EXISTS public.calendly_central_auth CASCADE;
DROP TABLE IF EXISTS public.consultant_calendar_integrations CASCADE;
DROP TABLE IF EXISTS public.consultant_calendly_event_types CASCADE;

-- 2. Remover colunas extras da tabela profiles
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS calendly_user_uri,
DROP COLUMN IF EXISTS calendly_event_type_uri,
DROP COLUMN IF EXISTS calendly_scheduling_url,
DROP COLUMN IF EXISTS calendly_connected;

-- 3. Limpar o histórico de migrações para as versões que sumiram do código
DELETE FROM supabase_migrations.schema_migrations 
WHERE version IN ('20260530154258', '20260530151617', '20260530150217', '20260530143420');