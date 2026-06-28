CREATE TYPE movement_type AS ENUM (
  'capital_deposit',
  'capital_withdrawal',
  'transfer',
  'conversion',
  'cashback',
  'bonus',
  'fee',
  'balance_adjustment'
);

CREATE TYPE movement_direction AS ENUM ('credit', 'debit');
CREATE TYPE movement_status AS ENUM (
  'pending',
  'completed',
  'cancelled',
  'failed'
);

CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type movement_type NOT NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  counter_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  currency_id UUID NOT NULL REFERENCES currencies(id),
  amount NUMERIC(20, 8) NOT NULL CHECK (amount > 0),
  direction movement_direction NOT NULL,
  status movement_status NOT NULL DEFAULT 'completed',
  occurred_at DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  external_id TEXT,
  transfer_group_id UUID,
  exchange_rate NUMERIC(20, 8) NOT NULL DEFAULT 1,
  amount_brl NUMERIC(20, 8) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX movements_operator_date_idx ON movements (operator_id, occurred_at DESC);
CREATE INDEX movements_account_idx ON movements (account_id, currency_id);
CREATE INDEX movements_type_status_idx ON movements (type, status);
CREATE INDEX movements_transfer_group_idx ON movements (transfer_group_id)
  WHERE transfer_group_id IS NOT NULL;

CREATE UNIQUE INDEX movements_external_id_unique
  ON movements (operator_id, external_id)
  WHERE external_id IS NOT NULL AND external_id <> '';

ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operator_select_movements" ON movements
  FOR SELECT USING (operator_id = auth.uid());

CREATE POLICY "operator_insert_movements" ON movements
  FOR INSERT WITH CHECK (operator_id = auth.uid());

CREATE POLICY "operator_update_movements" ON movements
  FOR UPDATE USING (operator_id = auth.uid());

CREATE POLICY "operator_delete_movements" ON movements
  FOR DELETE USING (operator_id = auth.uid());

CREATE TRIGGER movements_updated_at
  BEFORE UPDATE ON movements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();