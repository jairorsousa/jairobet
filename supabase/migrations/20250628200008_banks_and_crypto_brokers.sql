CREATE TABLE banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  status holder_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE crypto_brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  status holder_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX banks_operator_idx ON banks (operator_id);
CREATE INDEX crypto_brokers_operator_idx ON crypto_brokers (operator_id);

ALTER TABLE accounts
  ADD COLUMN bank_id UUID REFERENCES banks(id) ON DELETE SET NULL,
  ADD COLUMN crypto_broker_id UUID REFERENCES crypto_brokers(id) ON DELETE SET NULL;

CREATE INDEX accounts_bank_idx ON accounts (bank_id);
CREATE INDEX accounts_crypto_broker_idx ON accounts (crypto_broker_id);

ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_brokers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operator_select_banks" ON banks
  FOR SELECT USING (operator_id = auth.uid());

CREATE POLICY "operator_insert_banks" ON banks
  FOR INSERT WITH CHECK (operator_id = auth.uid());

CREATE POLICY "operator_update_banks" ON banks
  FOR UPDATE USING (operator_id = auth.uid());

CREATE POLICY "operator_delete_banks" ON banks
  FOR DELETE USING (operator_id = auth.uid());

CREATE POLICY "operator_select_crypto_brokers" ON crypto_brokers
  FOR SELECT USING (operator_id = auth.uid());

CREATE POLICY "operator_insert_crypto_brokers" ON crypto_brokers
  FOR INSERT WITH CHECK (operator_id = auth.uid());

CREATE POLICY "operator_update_crypto_brokers" ON crypto_brokers
  FOR UPDATE USING (operator_id = auth.uid());

CREATE POLICY "operator_delete_crypto_brokers" ON crypto_brokers
  FOR DELETE USING (operator_id = auth.uid());

CREATE TRIGGER banks_updated_at
  BEFORE UPDATE ON banks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER crypto_brokers_updated_at
  BEFORE UPDATE ON crypto_brokers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON banks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON crypto_brokers TO authenticated;