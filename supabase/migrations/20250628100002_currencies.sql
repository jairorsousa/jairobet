CREATE TYPE currency_type AS ENUM ('fiat', 'crypto');

CREATE TABLE currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type currency_type NOT NULL DEFAULT 'fiat',
  decimal_places SMALLINT NOT NULL DEFAULT 2,
  last_rate_brl NUMERIC(20, 8) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO currencies (code, name, symbol, type, decimal_places, last_rate_brl) VALUES
  ('BRL', 'Real Brasileiro', 'R$', 'fiat', 2, 1),
  ('USDT', 'Tether', 'USDT', 'crypto', 2, 5.50),
  ('USDC', 'USD Coin', 'USDC', 'crypto', 2, 5.50),
  ('BTC', 'Bitcoin', '₿', 'crypto', 8, 550000),
  ('ETH', 'Ethereum', 'ETH', 'crypto', 8, 18000);

ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_currencies" ON currencies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_update_currencies" ON currencies
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER currencies_updated_at
  BEFORE UPDATE ON currencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();