-- Sincronizar o histórico de migrações
-- Remove as versões que foram aplicadas em sessões anteriores mas que foram revertidas no código
DELETE FROM supabase_migrations.schema_migrations 
WHERE version IN (
  '20260530212557', 
  '20260530211415', 
  '20260530211335', 
  '20260530210137', 
  '20260530205520'
);

-- Reconciliar a versão da migração de limpeza caso haja divergência de timestamp
-- (No banco estava 195433, no código está 195436)
-- UPDATE supabase_migrations.schema_migrations SET version = '20260530195436' WHERE version = '20260530195433';
