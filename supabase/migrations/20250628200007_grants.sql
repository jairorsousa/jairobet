-- Permissões para roles do Supabase (migrations manuais não herdam grants automáticos)
GRANT USAGE ON SCHEMA public TO authenticated, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON holders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON account_currencies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON movements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON reconciliations TO authenticated;

GRANT SELECT, UPDATE ON currencies TO authenticated;
GRANT SELECT ON currencies TO anon;