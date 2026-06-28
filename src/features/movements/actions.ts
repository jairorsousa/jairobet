"use server";

import { revalidatePath } from "next/cache";
import { recalculateBalancesForAccounts } from "@/features/movements/balance-service";
import {
  confirmTransferSchema,
  createBalanceAdjustmentSchema,
  createBonusSchema,
  createCapitalDepositSchema,
  createCapitalWithdrawalSchema,
  createCashbackSchema,
  createConversionSchema,
  createFeeSchema,
  createTransferSchema,
  mapBonusToMovementStatus,
  mapCashbackToMovementStatus,
  updateCapitalMovementSchema,
  updateSimpleMovementSchema,
  type ConfirmTransferInput,
  type CreateBalanceAdjustmentInput,
  type CreateBonusInput,
  type CreateCapitalDepositInput,
  type CreateCapitalWithdrawalInput,
  type CreateCashbackInput,
  type CreateConversionInput,
  type CreateFeeInput,
  type CreateTransferInput,
  type UpdateCapitalMovementInput,
  type UpdateSimpleMovementInput,
} from "@/features/movements/schemas";
import { calculateAmountBrl } from "@/shared/lib/domain/balance";
import { getOperatorId } from "@/shared/lib/auth/get-operator";
import { createClient } from "@/shared/lib/supabase/server";
import type {
  Movement,
  MovementType,
  MovementWithDetails,
  PendingTransfer,
} from "@/shared/types/database";

const MOVEMENT_SELECT = `
  *,
  account:accounts(id, name, type, holder_id, holder:holders(id, name)),
  counter_account:accounts!movements_counter_account_id_fkey(id, name),
  currency:currencies(*)
`;

export interface ListMovementsFilters {
  type?: MovementType | "all";
  account_id?: string | "all";
  holder_id?: string | "all";
  status?: string | "all";
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
}

async function assertAccountOpen(accountId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("status, name")
    .eq("id", accountId)
    .single();

  if (error || !data) throw new Error("Conta não encontrada");
  if (data.status === "closed") {
    throw new Error(`Conta "${data.name}" está encerrada`);
  }
  return data;
}

async function getCurrencyRate(currencyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("currencies")
    .select("code, last_rate_brl")
    .eq("id", currencyId)
    .single();

  if (error || !data) throw new Error("Moeda não encontrada");
  return data as { code: string; last_rate_brl: number };
}

export async function hasDuplicateExternalId(
  externalId?: string,
): Promise<boolean> {
  if (!externalId?.trim()) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("movements")
    .select("id")
    .eq("external_id", externalId.trim())
    .maybeSingle();
  return Boolean(data);
}

async function createMovementRow(input: {
  type: MovementType;
  account_id: string;
  counter_account_id?: string | null;
  currency_id: string;
  amount: number;
  direction: "credit" | "debit";
  status: Movement["status"];
  occurred_at: string;
  description?: string | null;
  external_id?: string | null;
  transfer_group_id?: string | null;
  exchange_rate: number;
  amount_brl: number;
  metadata?: Record<string, unknown>;
}) {
  const operatorId = await getOperatorId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("movements")
    .insert({
      operator_id: operatorId,
      type: input.type,
      account_id: input.account_id,
      counter_account_id: input.counter_account_id ?? null,
      currency_id: input.currency_id,
      amount: input.amount,
      direction: input.direction,
      status: input.status,
      occurred_at: input.occurred_at,
      description: input.description ?? null,
      external_id: input.external_id ?? null,
      transfer_group_id: input.transfer_group_id ?? null,
      exchange_rate: input.exchange_rate,
      amount_brl: input.amount_brl,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Movement;
}

function revalidateMovementPaths() {
  revalidatePath("/movimentacoes");
  revalidatePath("/transferencias");
  revalidatePath("/contas");
  revalidatePath("/conciliacao");
  revalidatePath("/alertas");
  revalidatePath("/");
}

export async function listMovements(
  filters: ListMovementsFilters = {},
): Promise<{ items: MovementWithDetails[]; total: number }> {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("movements")
    .select(MOVEMENT_SELECT, { count: "exact" })
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }
  if (filters.account_id && filters.account_id !== "all") {
    query = query.eq("account_id", filters.account_id);
  }
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.from_date) {
    query = query.gte("occurred_at", filters.from_date);
  }
  if (filters.to_date) {
    query = query.lte("occurred_at", filters.to_date);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);

  let items = (data ?? []) as unknown as MovementWithDetails[];

  if (filters.holder_id && filters.holder_id !== "all") {
    items = items.filter((m) => m.account.holder_id === filters.holder_id);
  }

  return { items, total: count ?? items.length };
}

export async function listAllMovements(
  filters: ListMovementsFilters = {},
): Promise<MovementWithDetails[]> {
  const supabase = await createClient();
  const pageSize = 1000;
  const all: MovementWithDetails[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from("movements")
      .select(MOVEMENT_SELECT)
      .order("occurred_at", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (filters.type && filters.type !== "all") {
      query = query.eq("type", filters.type);
    }
    if (filters.account_id && filters.account_id !== "all") {
      query = query.eq("account_id", filters.account_id);
    }
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.from_date) {
      query = query.gte("occurred_at", filters.from_date);
    }
    if (filters.to_date) {
      query = query.lte("occurred_at", filters.to_date);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data?.length) break;

    all.push(...(data as unknown as MovementWithDetails[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  if (filters.holder_id && filters.holder_id !== "all") {
    return all.filter((m) => m.account.holder_id === filters.holder_id);
  }

  return all;
}

export async function listAccountMovements(
  accountId: string,
  limit = 50,
): Promise<MovementWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movements")
    .select(MOVEMENT_SELECT)
    .or(`account_id.eq.${accountId},counter_account_id.eq.${accountId}`)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as MovementWithDetails[];
}

export async function listPendingTransfers(): Promise<PendingTransfer[]> {
  const supabase = await createClient();

  const { data: debits, error } = await supabase
    .from("movements")
    .select(MOVEMENT_SELECT)
    .eq("type", "transfer")
    .eq("direction", "debit")
    .eq("status", "pending")
    .order("occurred_at", { ascending: false });

  if (error) throw new Error(error.message);

  const items = (debits ?? []) as unknown as MovementWithDetails[];

  const result: PendingTransfer[] = [];
  for (const debit of items) {
    if (!debit.transfer_group_id) continue;
    const { data: credit } = await supabase
      .from("movements")
      .select("*")
      .eq("transfer_group_id", debit.transfer_group_id)
      .eq("direction", "credit")
      .maybeSingle();

    result.push({
      ...debit,
      credit_movement: (credit as Movement) ?? null,
    });
  }

  return result;
}

export async function createCapitalDeposit(input: CreateCapitalDepositInput) {
  const parsed = createCapitalDepositSchema.parse(input);
  await assertAccountOpen(parsed.account_id);
  const currency = await getCurrencyRate(parsed.currency_id);

  const movement = await createMovementRow({
    type: "capital_deposit",
    account_id: parsed.account_id,
    currency_id: parsed.currency_id,
    amount: parsed.amount,
    direction: "credit",
    status: "completed",
    occurred_at: parsed.occurred_at,
    description: parsed.description ?? "Aporte de capital",
    exchange_rate: currency.last_rate_brl,
    amount_brl: calculateAmountBrl(
      parsed.amount,
      currency.code,
      currency.last_rate_brl,
    ),
  });

  await recalculateBalancesForAccounts([
    { accountId: parsed.account_id, currencyId: parsed.currency_id },
  ]);
  revalidateMovementPaths();
  return movement;
}

export async function createCapitalWithdrawal(
  input: CreateCapitalWithdrawalInput,
) {
  const parsed = createCapitalWithdrawalSchema.parse(input);
  await assertAccountOpen(parsed.account_id);
  const currency = await getCurrencyRate(parsed.currency_id);

  const movement = await createMovementRow({
    type: "capital_withdrawal",
    account_id: parsed.account_id,
    currency_id: parsed.currency_id,
    amount: parsed.amount,
    direction: "debit",
    status: "completed",
    occurred_at: parsed.occurred_at,
    description: parsed.description ?? "Retirada de capital",
    exchange_rate: currency.last_rate_brl,
    amount_brl: calculateAmountBrl(
      parsed.amount,
      currency.code,
      currency.last_rate_brl,
    ),
  });

  await recalculateBalancesForAccounts([
    { accountId: parsed.account_id, currencyId: parsed.currency_id },
  ]);
  revalidateMovementPaths();
  return movement;
}

export async function createTransfer(input: CreateTransferInput) {
  const parsed = createTransferSchema.parse(input);
  await assertAccountOpen(parsed.from_account_id);
  await assertAccountOpen(parsed.to_account_id);
  const fromCurrency = await getCurrencyRate(parsed.from_currency_id);
  const toCurrency = await getCurrencyRate(parsed.to_currency_id);
  const transferGroupId = crypto.randomUUID();

  const { data: toAccount } = await createClient()
    .then((s) =>
      s.from("accounts").select("name").eq("id", parsed.to_account_id).single(),
    );
  const { data: fromAccount } = await createClient()
    .then((s) =>
      s
        .from("accounts")
        .select("name")
        .eq("id", parsed.from_account_id)
        .single(),
    );

  const debit = await createMovementRow({
    type: "transfer",
    account_id: parsed.from_account_id,
    counter_account_id: parsed.to_account_id,
    currency_id: parsed.from_currency_id,
    amount: parsed.sent_amount,
    direction: "debit",
    status: parsed.status === "completed" ? "completed" : "pending",
    occurred_at: parsed.occurred_at,
    description:
      parsed.description ??
      `Transferência → ${toAccount?.name ?? "destino"}`,
    external_id: parsed.external_id,
    transfer_group_id: transferGroupId,
    exchange_rate: fromCurrency.last_rate_brl,
    amount_brl: calculateAmountBrl(
      parsed.sent_amount,
      fromCurrency.code,
      fromCurrency.last_rate_brl,
    ),
    metadata: {
      method: parsed.method,
      expected_received: parsed.expected_received_amount,
      fee_amount: parsed.fee_amount,
      to_currency_id: parsed.to_currency_id,
    },
  });

  const recalcPairs = [
    {
      accountId: parsed.from_account_id,
      currencyId: parsed.from_currency_id,
    },
  ];

  if (parsed.status === "completed" && parsed.received_amount) {
    await createMovementRow({
      type: "transfer",
      account_id: parsed.to_account_id,
      counter_account_id: parsed.from_account_id,
      currency_id: parsed.to_currency_id,
      amount: parsed.received_amount,
      direction: "credit",
      status: "completed",
      occurred_at: parsed.occurred_at,
      description: `Transferência ← ${fromAccount?.name ?? "origem"}`,
      external_id: parsed.external_id,
      transfer_group_id: transferGroupId,
      exchange_rate: toCurrency.last_rate_brl,
      amount_brl: calculateAmountBrl(
        parsed.received_amount,
        toCurrency.code,
        toCurrency.last_rate_brl,
      ),
      metadata: { method: parsed.method },
    });
    recalcPairs.push({
      accountId: parsed.to_account_id,
      currencyId: parsed.to_currency_id,
    });
  }

  await recalculateBalancesForAccounts(recalcPairs);
  revalidateMovementPaths();
  return debit;
}

export async function confirmTransferReceipt(input: ConfirmTransferInput) {
  const parsed = confirmTransferSchema.parse(input);
  const supabase = await createClient();

  const { data: debit, error } = await supabase
    .from("movements")
    .select("*")
    .eq("transfer_group_id", parsed.transfer_group_id)
    .eq("direction", "debit")
    .single();

  if (error || !debit) throw new Error("Transferência não encontrada");
  if (debit.status !== "pending") {
    throw new Error("Transferência já foi processada");
  }

  const metadata = debit.metadata as Record<string, unknown>;
  const toCurrencyId =
    (metadata.to_currency_id as string) ?? debit.currency_id;
  const toCurrency = await getCurrencyRate(toCurrencyId);

  const { data: fromAccount } = await supabase
    .from("accounts")
    .select("name")
    .eq("id", debit.account_id)
    .single();

  const toAccountId = debit.counter_account_id;
  if (!toAccountId) throw new Error("Conta destino não definida");
  await assertAccountOpen(toAccountId);

  await createMovementRow({
    type: "transfer",
    account_id: toAccountId,
    counter_account_id: debit.account_id,
    currency_id: toCurrencyId,
    amount: parsed.received_amount,
    direction: "credit",
    status: "completed",
    occurred_at: parsed.occurred_at ?? debit.occurred_at,
    description: `Transferência ← ${fromAccount?.name ?? "origem"}`,
    external_id: debit.external_id,
    transfer_group_id: parsed.transfer_group_id,
    exchange_rate: toCurrency.last_rate_brl,
    amount_brl: calculateAmountBrl(
      parsed.received_amount,
      toCurrency.code,
      toCurrency.last_rate_brl,
    ),
  });

  await supabase
    .from("movements")
    .update({ status: "completed" })
    .eq("id", debit.id);

  await recalculateBalancesForAccounts([
    { accountId: debit.account_id, currencyId: debit.currency_id },
    { accountId: toAccountId, currencyId: toCurrencyId },
  ]);

  revalidateMovementPaths();
}

export async function createFee(input: CreateFeeInput) {
  const parsed = createFeeSchema.parse(input);
  await assertAccountOpen(parsed.account_id);
  const currency = await getCurrencyRate(parsed.currency_id);

  const movement = await createMovementRow({
    type: "fee",
    account_id: parsed.account_id,
    currency_id: parsed.currency_id,
    amount: parsed.amount,
    direction: "debit",
    status: "completed",
    occurred_at: parsed.occurred_at,
    description: parsed.description ?? "Taxa",
    external_id: parsed.external_id,
    exchange_rate: currency.last_rate_brl,
    amount_brl: calculateAmountBrl(
      parsed.amount,
      currency.code,
      currency.last_rate_brl,
    ),
    metadata: parsed.transfer_group_id
      ? { transfer_group_id: parsed.transfer_group_id }
      : {},
  });

  await recalculateBalancesForAccounts([
    { accountId: parsed.account_id, currencyId: parsed.currency_id },
  ]);
  revalidateMovementPaths();
  return movement;
}

export async function createCashback(input: CreateCashbackInput) {
  const parsed = createCashbackSchema.parse(input);
  await assertAccountOpen(parsed.account_id);
  const currency = await getCurrencyRate(parsed.currency_id);
  const movementStatus = mapCashbackToMovementStatus(parsed.status);

  const movement = await createMovementRow({
    type: "cashback",
    account_id: parsed.account_id,
    currency_id: parsed.currency_id,
    amount: parsed.amount,
    direction: "credit",
    status: movementStatus,
    occurred_at: parsed.occurred_at,
    description: parsed.description ?? "Cashback",
    external_id: parsed.external_id,
    exchange_rate: currency.last_rate_brl,
    amount_brl: calculateAmountBrl(
      parsed.amount,
      currency.code,
      currency.last_rate_brl,
    ),
    metadata: { cashback_status: parsed.status },
  });

  await recalculateBalancesForAccounts([
    { accountId: parsed.account_id, currencyId: parsed.currency_id },
  ]);
  revalidateMovementPaths();
  return movement;
}

export async function createBonus(input: CreateBonusInput) {
  const parsed = createBonusSchema.parse(input);
  await assertAccountOpen(parsed.account_id);
  const currency = await getCurrencyRate(parsed.currency_id);
  const movementStatus = mapBonusToMovementStatus(parsed.status);

  const movement = await createMovementRow({
    type: "bonus",
    account_id: parsed.account_id,
    currency_id: parsed.currency_id,
    amount: parsed.amount,
    direction: "credit",
    status: movementStatus,
    occurred_at: parsed.occurred_at,
    description: parsed.description ?? "Bônus",
    external_id: parsed.external_id,
    exchange_rate: currency.last_rate_brl,
    amount_brl: calculateAmountBrl(
      parsed.amount,
      currency.code,
      currency.last_rate_brl,
    ),
    metadata: {
      bonus_status: parsed.status,
      withdrawable: parsed.withdrawable,
      bonus_type: parsed.bonus_type,
      valid_until: parsed.valid_until,
    },
  });

  await recalculateBalancesForAccounts([
    { accountId: parsed.account_id, currencyId: parsed.currency_id },
  ]);
  revalidateMovementPaths();
  return movement;
}

export async function createConversion(input: CreateConversionInput) {
  const parsed = createConversionSchema.parse(input);
  await assertAccountOpen(parsed.account_id);

  if (parsed.from_currency_id === parsed.to_currency_id) {
    throw new Error("Moedas de origem e destino devem ser diferentes");
  }

  const fromCurrency = await getCurrencyRate(parsed.from_currency_id);
  const toCurrency = await getCurrencyRate(parsed.to_currency_id);
  const groupId = crypto.randomUUID();

  const recalcPairs = [
    {
      accountId: parsed.account_id,
      currencyId: parsed.from_currency_id,
    },
    {
      accountId: parsed.account_id,
      currencyId: parsed.to_currency_id,
    },
  ];

  await createMovementRow({
    type: "conversion",
    account_id: parsed.account_id,
    currency_id: parsed.from_currency_id,
    amount: parsed.from_amount,
    direction: "debit",
    status: "completed",
    occurred_at: parsed.occurred_at,
    description: parsed.description ?? `Conversão ${fromCurrency.code} → ${toCurrency.code}`,
    transfer_group_id: groupId,
    exchange_rate: fromCurrency.last_rate_brl,
    amount_brl: calculateAmountBrl(
      parsed.from_amount,
      fromCurrency.code,
      fromCurrency.last_rate_brl,
    ),
    metadata: {
      to_currency_id: parsed.to_currency_id,
      to_amount: parsed.to_amount,
      quoted_rate: parsed.exchange_rate,
    },
  });

  await createMovementRow({
    type: "conversion",
    account_id: parsed.account_id,
    currency_id: parsed.to_currency_id,
    amount: parsed.to_amount,
    direction: "credit",
    status: "completed",
    occurred_at: parsed.occurred_at,
    description: parsed.description ?? `Conversão ${fromCurrency.code} → ${toCurrency.code}`,
    transfer_group_id: groupId,
    exchange_rate: toCurrency.last_rate_brl,
    amount_brl: calculateAmountBrl(
      parsed.to_amount,
      toCurrency.code,
      toCurrency.last_rate_brl,
    ),
    metadata: {
      from_currency_id: parsed.from_currency_id,
      from_amount: parsed.from_amount,
      quoted_rate: parsed.exchange_rate,
    },
  });

  if (parsed.fee_amount && parsed.fee_amount > 0) {
    await createMovementRow({
      type: "fee",
      account_id: parsed.account_id,
      currency_id: parsed.from_currency_id,
      amount: parsed.fee_amount,
      direction: "debit",
      status: "completed",
      occurred_at: parsed.occurred_at,
      description: "Taxa de conversão",
      transfer_group_id: groupId,
      exchange_rate: fromCurrency.last_rate_brl,
      amount_brl: calculateAmountBrl(
        parsed.fee_amount,
        fromCurrency.code,
        fromCurrency.last_rate_brl,
      ),
      metadata: { conversion_group_id: groupId },
    });
    recalcPairs.push({
      accountId: parsed.account_id,
      currencyId: parsed.from_currency_id,
    });
  }

  await recalculateBalancesForAccounts(recalcPairs);
  revalidateMovementPaths();
}

export async function createBalanceAdjustment(
  input: CreateBalanceAdjustmentInput,
) {
  const parsed = createBalanceAdjustmentSchema.parse(input);
  await assertAccountOpen(parsed.account_id);
  const currency = await getCurrencyRate(parsed.currency_id);

  const movement = await createMovementRow({
    type: "balance_adjustment",
    account_id: parsed.account_id,
    currency_id: parsed.currency_id,
    amount: parsed.amount,
    direction: parsed.direction,
    status: "completed",
    occurred_at: parsed.occurred_at,
    description: `Ajuste: ${parsed.reason}`,
    exchange_rate: currency.last_rate_brl,
    amount_brl: calculateAmountBrl(
      parsed.amount,
      currency.code,
      currency.last_rate_brl,
    ),
    metadata: { reason: parsed.reason },
  });

  await recalculateBalancesForAccounts([
    { accountId: parsed.account_id, currencyId: parsed.currency_id },
  ]);
  revalidateMovementPaths();
  return movement;
}

export async function updateSimpleMovement(input: UpdateSimpleMovementInput) {
  const parsed = updateSimpleMovementSchema.parse(input);
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("movements")
    .select("*")
    .eq("id", parsed.id)
    .single();

  if (fetchError || !existing) throw new Error("Movimentação não encontrada");

  const editableTypes = [
    "fee",
    "cashback",
    "bonus",
    "balance_adjustment",
    "capital_deposit",
    "capital_withdrawal",
  ];
  if (!editableTypes.includes(existing.type)) {
    throw new Error("Este tipo de movimentação não pode ser editado");
  }

  await assertAccountOpen(parsed.account_id);
  const currency = await getCurrencyRate(parsed.currency_id);

  const { error } = await supabase
    .from("movements")
    .update({
      account_id: parsed.account_id,
      currency_id: parsed.currency_id,
      amount: parsed.amount,
      occurred_at: parsed.occurred_at,
      description: parsed.description ?? existing.description,
      status: parsed.status ?? existing.status,
      exchange_rate: currency.last_rate_brl,
      amount_brl: calculateAmountBrl(
        parsed.amount,
        currency.code,
        currency.last_rate_brl,
      ),
      metadata: parsed.metadata ?? existing.metadata,
    })
    .eq("id", parsed.id);

  if (error) throw new Error(error.message);

  await recalculateBalancesForAccounts([
    { accountId: existing.account_id, currencyId: existing.currency_id },
    { accountId: parsed.account_id, currencyId: parsed.currency_id },
  ]);

  revalidateMovementPaths();
}

export async function updateCapitalMovement(input: UpdateCapitalMovementInput) {
  const parsed = updateCapitalMovementSchema.parse(input);
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("movements")
    .select("*")
    .eq("id", parsed.id)
    .single();

  if (fetchError || !existing) throw new Error("Movimentação não encontrada");
  if (!["capital_deposit", "capital_withdrawal"].includes(existing.type)) {
    throw new Error("Somente aportes e retiradas podem ser editados aqui");
  }

  await assertAccountOpen(parsed.account_id);
  const currency = await getCurrencyRate(parsed.currency_id);

  const { error } = await supabase
    .from("movements")
    .update({
      account_id: parsed.account_id,
      currency_id: parsed.currency_id,
      amount: parsed.amount,
      occurred_at: parsed.occurred_at,
      description: parsed.description ?? existing.description,
      exchange_rate: currency.last_rate_brl,
      amount_brl: calculateAmountBrl(
        parsed.amount,
        currency.code,
        currency.last_rate_brl,
      ),
    })
    .eq("id", parsed.id);

  if (error) throw new Error(error.message);

  await recalculateBalancesForAccounts([
    { accountId: existing.account_id, currencyId: existing.currency_id },
    { accountId: parsed.account_id, currencyId: parsed.currency_id },
  ]);

  revalidateMovementPaths();
}

export async function deleteMovement(id: string) {
  const supabase = await createClient();

  const { data: movement, error: fetchError } = await supabase
    .from("movements")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !movement) throw new Error("Movimentação não encontrada");

  const recalcPairs: Array<{ accountId: string; currencyId: string }> = [
    { accountId: movement.account_id, currencyId: movement.currency_id },
  ];

  if (movement.transfer_group_id) {
    const { data: related } = await supabase
      .from("movements")
      .select("*")
      .eq("transfer_group_id", movement.transfer_group_id);

    for (const row of related ?? []) {
      if (row.id !== id) {
        await supabase.from("movements").delete().eq("id", row.id);
        recalcPairs.push({
          accountId: row.account_id,
          currencyId: row.currency_id,
        });
      }
    }
  }

  const { error } = await supabase.from("movements").delete().eq("id", id);
  if (error) throw new Error(error.message);

  const uniqueRecalc = new Map(
    recalcPairs.map((p) => [`${p.accountId}:${p.currencyId}`, p]),
  );
  await recalculateBalancesForAccounts([...uniqueRecalc.values()]);
  revalidateMovementPaths();
}