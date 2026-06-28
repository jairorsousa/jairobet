-- Demo seed (opcional): requer usuário em auth.users (cadastre-se em /login primeiro).
-- Após o primeiro login, rode `pnpm db:reset` para popular titulares e contas demo.

DO $$
DECLARE
  op_id UUID;
  brl_id UUID;
  h1_id UUID;
  h2_id UUID;
  acc_bank UUID;
  acc_bet UUID;
BEGIN
  SELECT id INTO op_id FROM auth.users ORDER BY created_at LIMIT 1;
  IF op_id IS NULL THEN
    RAISE NOTICE 'JairoBet seed: nenhum usuário em auth.users — faça login primeiro.';
    RETURN;
  END IF;

  SELECT id INTO brl_id FROM currencies WHERE code = 'BRL';

  SELECT id INTO h1_id FROM holders
  WHERE operator_id = op_id AND name = 'Titular Demo A';

  IF h1_id IS NULL THEN
    INSERT INTO holders (operator_id, name, notes, status)
    VALUES (op_id, 'Titular Demo A', 'Conta bancária e apostas', 'active')
    RETURNING id INTO h1_id;
  END IF;

  SELECT id INTO h2_id FROM holders
  WHERE operator_id = op_id AND name = 'Titular Demo B';

  IF h2_id IS NULL THEN
    INSERT INTO holders (operator_id, name, status)
    VALUES (op_id, 'Titular Demo B', 'active')
    RETURNING id INTO h2_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM accounts WHERE operator_id = op_id AND name = 'Nubank Demo'
  ) THEN
    INSERT INTO accounts (
      operator_id, holder_id, name, type, institution,
      default_currency_id, initial_balance_date, status
    ) VALUES (
      op_id, h1_id, 'Nubank Demo', 'bank', 'Nubank', brl_id, CURRENT_DATE, 'active'
    ) RETURNING id INTO acc_bank;

    INSERT INTO account_currencies (account_id, currency_id, initial_balance, calculated_balance)
    VALUES (acc_bank, brl_id, 5000, 5000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM accounts WHERE operator_id = op_id AND name = 'Bet Demo'
  ) THEN
    INSERT INTO accounts (
      operator_id, holder_id, name, type, institution,
      default_currency_id, initial_balance_date, status
    ) VALUES (
      op_id, h1_id, 'Bet Demo', 'betting', 'Casa X', brl_id, CURRENT_DATE, 'active'
    ) RETURNING id INTO acc_bet;

    INSERT INTO account_currencies (account_id, currency_id, initial_balance, calculated_balance)
    VALUES (acc_bet, brl_id, 1000, 1000);
  END IF;

  RAISE NOTICE 'JairoBet seed: titulares e contas demo prontos para o operador %', op_id;
END $$;