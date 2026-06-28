CREATE TYPE holder_status AS ENUM ('active', 'inactive');

CREATE TABLE holders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  status holder_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX holders_operator_idx ON holders (operator_id);

ALTER TABLE holders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operator_select_holders" ON holders
  FOR SELECT USING (operator_id = auth.uid());

CREATE POLICY "operator_insert_holders" ON holders
  FOR INSERT WITH CHECK (operator_id = auth.uid());

CREATE POLICY "operator_update_holders" ON holders
  FOR UPDATE USING (operator_id = auth.uid());

CREATE POLICY "operator_delete_holders" ON holders
  FOR DELETE USING (operator_id = auth.uid());

CREATE TRIGGER holders_updated_at
  BEFORE UPDATE ON holders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();