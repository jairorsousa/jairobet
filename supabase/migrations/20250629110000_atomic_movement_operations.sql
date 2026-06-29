CREATE OR REPLACE FUNCTION recalculate_account_currency_balance(
  p_account_id UUID,
  p_currency_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_initial NUMERIC(20, 8);
  v_delta NUMERIC(20, 8);
BEGIN
  SELECT initial_balance
  INTO v_initial
  FROM account_currencies
  WHERE account_id = p_account_id
    AND currency_id = p_currency_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COALESCE(
    SUM(
      CASE
        WHEN direction = 'debit' THEN -amount
        WHEN status = 'completed' THEN amount
        ELSE 0
      END
    ),
    0
  )
  INTO v_delta
  FROM movements
  WHERE account_id = p_account_id
    AND currency_id = p_currency_id;

  UPDATE account_currencies
  SET calculated_balance = v_initial + v_delta
  WHERE account_id = p_account_id
    AND currency_id = p_currency_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_transfer_atomic(
  p_operator_id UUID,
  p_transfer_group_id UUID,
  p_from_account_id UUID,
  p_to_account_id UUID,
  p_from_currency_id UUID,
  p_to_currency_id UUID,
  p_sent_amount NUMERIC,
  p_received_amount NUMERIC,
  p_status movement_status,
  p_occurred_at DATE,
  p_debit_description TEXT,
  p_credit_description TEXT,
  p_external_id TEXT,
  p_from_exchange_rate NUMERIC,
  p_to_exchange_rate NUMERIC,
  p_from_amount_brl NUMERIC,
  p_to_amount_brl NUMERIC,
  p_debit_metadata JSONB,
  p_credit_metadata JSONB
)
RETURNS movements
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_debit movements;
BEGIN
  IF p_operator_id <> auth.uid() THEN
    RAISE EXCEPTION 'Operador inválido';
  END IF;

  IF p_status = 'completed' AND p_received_amount IS NULL THEN
    RAISE EXCEPTION 'Informe o valor recebido';
  END IF;

  INSERT INTO movements (
    operator_id,
    type,
    account_id,
    counter_account_id,
    currency_id,
    amount,
    direction,
    status,
    occurred_at,
    description,
    external_id,
    transfer_group_id,
    exchange_rate,
    amount_brl,
    metadata
  )
  VALUES (
    p_operator_id,
    'transfer',
    p_from_account_id,
    p_to_account_id,
    p_from_currency_id,
    p_sent_amount,
    'debit',
    p_status,
    p_occurred_at,
    p_debit_description,
    NULLIF(p_external_id, ''),
    p_transfer_group_id,
    p_from_exchange_rate,
    p_from_amount_brl,
    COALESCE(p_debit_metadata, '{}'::jsonb)
  )
  RETURNING * INTO v_debit;

  IF p_status = 'completed' THEN
    INSERT INTO movements (
      operator_id,
      type,
      account_id,
      counter_account_id,
      currency_id,
      amount,
      direction,
      status,
      occurred_at,
      description,
      external_id,
      transfer_group_id,
      exchange_rate,
      amount_brl,
      metadata
    )
    VALUES (
      p_operator_id,
      'transfer',
      p_to_account_id,
      p_from_account_id,
      p_to_currency_id,
      p_received_amount,
      'credit',
      'completed',
      p_occurred_at,
      p_credit_description,
      NULL,
      p_transfer_group_id,
      p_to_exchange_rate,
      p_to_amount_brl,
      COALESCE(p_credit_metadata, '{}'::jsonb)
    );
  END IF;

  PERFORM recalculate_account_currency_balance(p_from_account_id, p_from_currency_id);
  IF p_status = 'completed' THEN
    PERFORM recalculate_account_currency_balance(p_to_account_id, p_to_currency_id);
  END IF;

  RETURN v_debit;
END;
$$;

CREATE OR REPLACE FUNCTION update_transfer_atomic(
  p_transfer_group_id UUID,
  p_sent_amount NUMERIC,
  p_received_amount NUMERIC,
  p_status movement_status,
  p_occurred_at DATE,
  p_debit_description TEXT,
  p_credit_description TEXT,
  p_external_id TEXT,
  p_to_account_id UUID,
  p_to_currency_id UUID,
  p_from_exchange_rate NUMERIC,
  p_to_exchange_rate NUMERIC,
  p_from_amount_brl NUMERIC,
  p_to_amount_brl NUMERIC,
  p_debit_metadata JSONB,
  p_credit_metadata JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_debit movements;
  v_credit movements;
BEGIN
  SELECT *
  INTO v_debit
  FROM movements
  WHERE transfer_group_id = p_transfer_group_id
    AND direction = 'debit'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transferência não encontrada';
  END IF;

  IF v_debit.operator_id <> auth.uid() THEN
    RAISE EXCEPTION 'Operador inválido';
  END IF;

  IF p_status = 'completed' AND p_received_amount IS NULL THEN
    RAISE EXCEPTION 'Informe o valor recebido';
  END IF;

  UPDATE movements
  SET
    amount = p_sent_amount,
    status = p_status,
    occurred_at = p_occurred_at,
    description = p_debit_description,
    external_id = NULLIF(p_external_id, ''),
    metadata = COALESCE(p_debit_metadata, '{}'::jsonb),
    exchange_rate = p_from_exchange_rate,
    amount_brl = p_from_amount_brl
  WHERE id = v_debit.id;

  SELECT *
  INTO v_credit
  FROM movements
  WHERE transfer_group_id = p_transfer_group_id
    AND direction = 'credit'
  FOR UPDATE;

  IF p_status = 'completed' THEN
    IF FOUND THEN
      UPDATE movements
      SET
        amount = p_received_amount,
        status = 'completed',
        occurred_at = p_occurred_at,
        description = p_credit_description,
        external_id = NULL,
        metadata = COALESCE(p_credit_metadata, '{}'::jsonb),
        exchange_rate = p_to_exchange_rate,
        amount_brl = p_to_amount_brl
      WHERE id = v_credit.id;
    ELSE
      INSERT INTO movements (
        operator_id,
        type,
        account_id,
        counter_account_id,
        currency_id,
        amount,
        direction,
        status,
        occurred_at,
        description,
        external_id,
        transfer_group_id,
        exchange_rate,
        amount_brl,
        metadata
      )
      VALUES (
        v_debit.operator_id,
        'transfer',
        p_to_account_id,
        v_debit.account_id,
        p_to_currency_id,
        p_received_amount,
        'credit',
        'completed',
        p_occurred_at,
        p_credit_description,
        NULL,
        p_transfer_group_id,
        p_to_exchange_rate,
        p_to_amount_brl,
        COALESCE(p_credit_metadata, '{}'::jsonb)
      );
    END IF;
  ELSIF FOUND THEN
    DELETE FROM movements WHERE id = v_credit.id;
    PERFORM recalculate_account_currency_balance(v_credit.account_id, v_credit.currency_id);
  END IF;

  PERFORM recalculate_account_currency_balance(v_debit.account_id, v_debit.currency_id);
  IF p_status = 'completed' THEN
    PERFORM recalculate_account_currency_balance(p_to_account_id, p_to_currency_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION confirm_transfer_receipt_atomic(
  p_transfer_group_id UUID,
  p_received_amount NUMERIC,
  p_occurred_at DATE,
  p_to_account_id UUID,
  p_to_currency_id UUID,
  p_credit_description TEXT,
  p_to_exchange_rate NUMERIC,
  p_to_amount_brl NUMERIC,
  p_credit_metadata JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_debit movements;
  v_existing_credit UUID;
BEGIN
  SELECT *
  INTO v_debit
  FROM movements
  WHERE transfer_group_id = p_transfer_group_id
    AND direction = 'debit'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transferência não encontrada';
  END IF;

  IF v_debit.operator_id <> auth.uid() THEN
    RAISE EXCEPTION 'Operador inválido';
  END IF;

  IF v_debit.status <> 'pending' THEN
    RAISE EXCEPTION 'Transferência já foi processada';
  END IF;

  SELECT id
  INTO v_existing_credit
  FROM movements
  WHERE transfer_group_id = p_transfer_group_id
    AND direction = 'credit'
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Transferência já possui recebimento';
  END IF;

  INSERT INTO movements (
    operator_id,
    type,
    account_id,
    counter_account_id,
    currency_id,
    amount,
    direction,
    status,
    occurred_at,
    description,
    external_id,
    transfer_group_id,
    exchange_rate,
    amount_brl,
    metadata
  )
  VALUES (
    v_debit.operator_id,
    'transfer',
    p_to_account_id,
    v_debit.account_id,
    p_to_currency_id,
    p_received_amount,
    'credit',
    'completed',
    COALESCE(p_occurred_at, v_debit.occurred_at),
    p_credit_description,
    NULL,
    p_transfer_group_id,
    p_to_exchange_rate,
    p_to_amount_brl,
    COALESCE(p_credit_metadata, '{}'::jsonb)
  );

  UPDATE movements
  SET status = 'completed'
  WHERE id = v_debit.id;

  PERFORM recalculate_account_currency_balance(v_debit.account_id, v_debit.currency_id);
  PERFORM recalculate_account_currency_balance(p_to_account_id, p_to_currency_id);
END;
$$;

CREATE OR REPLACE FUNCTION delete_movement_atomic(p_movement_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_movement movements;
  v_row movements;
  v_account_ids UUID[] := '{}';
  v_currency_ids UUID[] := '{}';
  i INTEGER;
BEGIN
  SELECT *
  INTO v_movement
  FROM movements
  WHERE id = p_movement_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movimentação não encontrada';
  END IF;

  IF v_movement.operator_id <> auth.uid() THEN
    RAISE EXCEPTION 'Operador inválido';
  END IF;

  IF v_movement.transfer_group_id IS NOT NULL THEN
    FOR v_row IN
      SELECT *
      FROM movements
      WHERE transfer_group_id = v_movement.transfer_group_id
      FOR UPDATE
    LOOP
      v_account_ids := array_append(v_account_ids, v_row.account_id);
      v_currency_ids := array_append(v_currency_ids, v_row.currency_id);
    END LOOP;

    DELETE FROM movements
    WHERE transfer_group_id = v_movement.transfer_group_id;
  ELSE
    v_account_ids := array_append(v_account_ids, v_movement.account_id);
    v_currency_ids := array_append(v_currency_ids, v_movement.currency_id);

    DELETE FROM movements
    WHERE id = v_movement.id;
  END IF;

  FOR i IN 1..COALESCE(array_length(v_account_ids, 1), 0) LOOP
    PERFORM recalculate_account_currency_balance(v_account_ids[i], v_currency_ids[i]);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION recalculate_account_currency_balance(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_transfer_atomic(
  UUID,
  UUID,
  UUID,
  UUID,
  UUID,
  UUID,
  NUMERIC,
  NUMERIC,
  movement_status,
  DATE,
  TEXT,
  TEXT,
  TEXT,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  JSONB,
  JSONB
) TO authenticated;
GRANT EXECUTE ON FUNCTION update_transfer_atomic(
  UUID,
  NUMERIC,
  NUMERIC,
  movement_status,
  DATE,
  TEXT,
  TEXT,
  TEXT,
  UUID,
  UUID,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  JSONB,
  JSONB
) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_transfer_receipt_atomic(
  UUID,
  NUMERIC,
  DATE,
  UUID,
  UUID,
  TEXT,
  NUMERIC,
  NUMERIC,
  JSONB
) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_movement_atomic(UUID) TO authenticated;
