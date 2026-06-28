CREATE TABLE reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  currency_id UUID NOT NULL REFERENCES currencies(id),
  reconciled_at DATE NOT NULL DEFAULT CURRENT_DATE,
  calculated_balance NUMERIC(20, 8) NOT NULL,
  reported_balance NUMERIC(20, 8) NOT NULL,
  difference NUMERIC(20, 8) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX reconciliations_account_date_idx
  ON reconciliations (account_id, reconciled_at DESC);

CREATE INDEX reconciliations_operator_idx ON reconciliations (operator_id);

CREATE INDEX reconciliations_account_currency_idx
  ON reconciliations (account_id, currency_id, reconciled_at DESC);

ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operator_select_reconciliations" ON reconciliations
  FOR SELECT USING (operator_id = auth.uid());

CREATE POLICY "operator_insert_reconciliations" ON reconciliations
  FOR INSERT WITH CHECK (operator_id = auth.uid());

CREATE POLICY "operator_update_reconciliations" ON reconciliations
  FOR UPDATE USING (operator_id = auth.uid());

CREATE POLICY "operator_delete_reconciliations" ON reconciliations
  FOR DELETE USING (operator_id = auth.uid());