-- Checklist RLS — todas as tabelas de dados do operador devem ter rowsecurity = true
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  (
    SELECT count(*)
    FROM pg_policies p
    WHERE p.tablename = c.relname
  ) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'holders',
    'banks',
    'crypto_brokers',
    'accounts',
    'account_currencies',
    'movements',
    'reconciliations',
    'currencies'
  )
ORDER BY c.relname;

-- Esperado: rls_enabled = true e policy_count >= 1 em todas as linhas

-- Grants para authenticated
SELECT
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'authenticated'
  AND table_schema = 'public'
  AND table_name IN (
    'holders',
    'banks',
    'crypto_brokers',
    'accounts',
    'account_currencies',
    'movements',
    'reconciliations',
    'currencies'
  )
ORDER BY table_name, privilege_type;