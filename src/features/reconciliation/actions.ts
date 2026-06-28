"use server";

import { differenceInDays, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { createBalanceAdjustment } from "@/features/movements/actions";
import { listAccounts } from "@/features/accounts/actions";
import { getOperatorId } from "@/shared/lib/auth/get-operator";
import { createClient } from "@/shared/lib/supabase/server";
import type {
  Reconciliation,
  ReconciliationOverviewRow,
  ReconciliationWithDetails,
} from "@/shared/types/database";
import {
  createReconciliationSchema,
  type CreateReconciliationInput,
} from "./schemas";

const RECONCILIATION_SELECT = `
  *,
  currency:currencies(*),
  account:accounts(id, name, type, holder:holders(id, name))
`;

function revalidateReconciliationPaths(accountId: string) {
  revalidatePath("/conciliacao");
  revalidatePath(`/contas/${accountId}`);
  revalidatePath("/");
  revalidatePath("/alertas");
}

export async function listReconciliations(
  accountId?: string,
): Promise<ReconciliationWithDetails[]> {
  const supabase = await createClient();

  let query = supabase
    .from("reconciliations")
    .select(RECONCILIATION_SELECT)
    .order("reconciled_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ReconciliationWithDetails[];
}

export async function listLatestReconciliations(): Promise<Reconciliation[]> {
  const rows = await listReconciliations();
  const latest = new Map<string, Reconciliation>();

  for (const row of rows) {
    const key = `${row.account_id}:${row.currency_id}`;
    const existing = latest.get(key);
    if (!existing || row.reconciled_at > existing.reconciled_at) {
      latest.set(key, row);
    }
  }

  return [...latest.values()];
}

export async function listReconciliationOverview(): Promise<
  ReconciliationOverviewRow[]
> {
  const [accounts, reconciliations] = await Promise.all([
    listAccounts({ status: "all" }),
    listLatestReconciliations(),
  ]);

  const latestMap = new Map<string, Reconciliation>();
  for (const row of reconciliations) {
    latestMap.set(`${row.account_id}:${row.currency_id}`, row);
  }

  const overview: ReconciliationOverviewRow[] = [];

  for (const account of accounts) {
    if (account.status === "closed") continue;

    for (const balance of account.balances) {
      const key = `${account.id}:${balance.currency_id}`;
      const last = latestMap.get(key) ?? null;

      overview.push({
        account_id: account.id,
        account_name: account.name,
        account_type: account.type,
        holder_name: account.holder.name,
        currency_id: balance.currency_id,
        currency_code: balance.currency.code,
        currency_decimal_places: balance.currency.decimal_places,
        currency_rate_brl: balance.currency.last_rate_brl,
        calculated_balance: balance.calculated_balance,
        last_reconciliation: last,
        days_since_reconciliation: last
          ? differenceInDays(new Date(), parseISO(last.reconciled_at))
          : differenceInDays(
              new Date(),
              parseISO(account.created_at.slice(0, 10)),
            ),
      });
    }
  }

  return overview.sort((a, b) => a.account_name.localeCompare(b.account_name));
}

export async function createReconciliation(input: CreateReconciliationInput) {
  const parsed = createReconciliationSchema.parse(input);
  const operatorId = await getOperatorId();
  const supabase = await createClient();

  const { data: balanceRow, error: balanceError } = await supabase
    .from("account_currencies")
    .select("calculated_balance")
    .eq("account_id", parsed.account_id)
    .eq("currency_id", parsed.currency_id)
    .single();

  if (balanceError || !balanceRow) {
    throw new Error("Saldo da conta/moeda não encontrado");
  }

  const calculated = Number(balanceRow.calculated_balance);
  const difference = parsed.reported_balance - calculated;

  const { data, error } = await supabase
    .from("reconciliations")
    .insert({
      operator_id: operatorId,
      account_id: parsed.account_id,
      currency_id: parsed.currency_id,
      reconciled_at: parsed.reconciled_at,
      calculated_balance: calculated,
      reported_balance: parsed.reported_balance,
      difference,
      notes: parsed.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (parsed.create_adjustment && difference !== 0) {
    const direction = difference > 0 ? "credit" : "debit";
    const amount = Math.abs(difference);
    const reason =
      parsed.notes?.trim() ||
      `Conciliação em ${parsed.reconciled_at}: saldo informado difere do calculado`;

    await createBalanceAdjustment({
      account_id: parsed.account_id,
      currency_id: parsed.currency_id,
      direction,
      amount,
      reason:
        reason.length >= 10
          ? reason
          : "Ajuste automático gerado pela conciliação manual",
      occurred_at: parsed.reconciled_at,
    });
  }

  revalidateReconciliationPaths(parsed.account_id);
  return data as Reconciliation;
}