CREATE TYPE account_type AS ENUM ('bank', 'crypto', 'betting');
CREATE TYPE account_status AS ENUM ('active', 'inactive', 'blocked', 'closed');

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  holder_id UUID NOT NULL REFERENCES holders(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  type account_type NOT NULL,
  institution TEXT NOT NULL,
  default_currency_id UUID NOT NULL REFERENCES currencies(id),
  initial_balance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status account_status NOT NULL DEFAULT 'active',
  masked_identifier TEXT,
  operational_limit NUMERIC(20, 8),
  notes TEXT,
  preferred_network TEXT,
  deposit_methods TEXT,
  withdrawal_methods TEXT,
  pending_balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE account_currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  currency_id UUID NOT NULL REFERENCES currencies(id),
  initial_balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  calculated_balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, currency_id)
);

CREATE INDEX accounts_operator_idx ON accounts (operator_id);
CREATE INDEX accounts_holder_idx ON accounts (holder_id);
CREATE INDEX accounts_type_status_idx ON accounts (type, status);
CREATE INDEX account_currencies_account_idx ON account_currencies (account_id);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operator_select_accounts" ON accounts
  FOR SELECT USING (operator_id = auth.uid());

CREATE POLICY "operator_insert_accounts" ON accounts
  FOR INSERT WITH CHECK (operator_id = auth.uid());

CREATE POLICY "operator_update_accounts" ON accounts
  FOR UPDATE USING (operator_id = auth.uid());

CREATE POLICY "operator_delete_accounts" ON accounts
  FOR DELETE USING (operator_id = auth.uid());

CREATE POLICY "operator_select_account_currencies" ON account_currencies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accounts a
      WHERE a.id = account_currencies.account_id AND a.operator_id = auth.uid()
    )
  );

CREATE POLICY "operator_insert_account_currencies" ON account_currencies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM accounts a
      WHERE a.id = account_currencies.account_id AND a.operator_id = auth.uid()
    )
  );

CREATE POLICY "operator_update_account_currencies" ON account_currencies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM accounts a
      WHERE a.id = account_currencies.account_id AND a.operator_id = auth.uid()
    )
  );

CREATE POLICY "operator_delete_account_currencies" ON account_currencies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM accounts a
      WHERE a.id = account_currencies.account_id AND a.operator_id = auth.uid()
    )
  );

CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER account_currencies_updated_at
  BEFORE UPDATE ON account_currencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();