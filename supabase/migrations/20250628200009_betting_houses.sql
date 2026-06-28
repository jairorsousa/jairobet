CREATE TABLE betting_houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  status holder_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX betting_houses_operator_idx ON betting_houses (operator_id);

ALTER TABLE accounts
  ADD COLUMN betting_house_id UUID REFERENCES betting_houses(id) ON DELETE SET NULL;

CREATE INDEX accounts_betting_house_idx ON accounts (betting_house_id);

ALTER TABLE betting_houses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operator_select_betting_houses" ON betting_houses
  FOR SELECT USING (operator_id = auth.uid());

CREATE POLICY "operator_insert_betting_houses" ON betting_houses
  FOR INSERT WITH CHECK (operator_id = auth.uid());

CREATE POLICY "operator_update_betting_houses" ON betting_houses
  FOR UPDATE USING (operator_id = auth.uid());

CREATE POLICY "operator_delete_betting_houses" ON betting_houses
  FOR DELETE USING (operator_id = auth.uid());

CREATE TRIGGER betting_houses_updated_at
  BEFORE UPDATE ON betting_houses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON betting_houses TO authenticated;