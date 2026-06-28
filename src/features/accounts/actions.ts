"use server";

import { revalidatePath } from "next/cache";
import {
  accountHasBalance,
  recalculateBalance,
} from "@/shared/lib/domain/balance";
import { getOperatorId } from "@/shared/lib/auth/get-operator";
import { createClient } from "@/shared/lib/supabase/server";
import type {
  Account,
  AccountStatus,
  AccountType,
  AccountWithDetails,
} from "@/shared/types/database";
import {
  createAccountSchema,
  updateAccountSchema,
  type CreateAccountInput,
  type UpdateAccountInput,
} from "./schemas";

export interface ListAccountsFilters {
  type?: AccountType | "all";
  holder_id?: string | "all";
  status?: AccountStatus | "all";
  with_balance?: boolean;
}

async function fetchAccountWithDetails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
): Promise<AccountWithDetails | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select(
      `
      *,
      holder:holders(id, name, status),
      default_currency:currencies(*),
      balances:account_currencies(
        *,
        currency:currencies(*)
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return data as unknown as AccountWithDetails;
}

export async function listAccounts(
  filters: ListAccountsFilters = {},
): Promise<AccountWithDetails[]> {
  const supabase = await createClient();

  let query = supabase
    .from("accounts")
    .select(
      `
      *,
      holder:holders(id, name, status),
      default_currency:currencies(*),
      balances:account_currencies(
        *,
        currency:currencies(*)
      )
    `,
    )
    .order("name");

  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }
  if (filters.holder_id && filters.holder_id !== "all") {
    query = query.eq("holder_id", filters.holder_id);
  }
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let accounts = (data ?? []) as unknown as AccountWithDetails[];

  if (filters.with_balance) {
    accounts = accounts.filter(accountHasBalance);
  }

  return accounts;
}

export async function getAccount(id: string): Promise<AccountWithDetails> {
  const supabase = await createClient();
  const account = await fetchAccountWithDetails(supabase, id);
  if (!account) throw new Error("Conta não encontrada");
  return account;
}

async function resolveInstitutionFields(
  supabase: Awaited<ReturnType<typeof createClient>>,
  parsed: CreateAccountInput | UpdateAccountInput,
) {
  if (parsed.type === "bank") {
    const { data, error } = await supabase
      .from("banks")
      .select("name")
      .eq("id", parsed.bank_id!)
      .single();
    if (error || !data) throw new Error("Banco inválido");
    return {
      institution: data.name,
      bank_id: parsed.bank_id!,
      crypto_broker_id: null,
      betting_house_id: null,
    };
  }

  if (parsed.type === "crypto") {
    const { data, error } = await supabase
      .from("crypto_brokers")
      .select("name")
      .eq("id", parsed.crypto_broker_id!)
      .single();
    if (error || !data) throw new Error("Corretora inválida");
    return {
      institution: data.name,
      bank_id: null,
      crypto_broker_id: parsed.crypto_broker_id!,
      betting_house_id: null,
    };
  }

  const { data, error } = await supabase
    .from("betting_houses")
    .select("name")
    .eq("id", parsed.betting_house_id!)
    .single();
  if (error || !data) throw new Error("Casa de apostas inválida");
  return {
    institution: data.name,
    bank_id: null,
    crypto_broker_id: null,
    betting_house_id: parsed.betting_house_id!,
  };
}

export async function createAccount(input: CreateAccountInput) {
  const parsed = createAccountSchema.parse(input);
  const operatorId = await getOperatorId();
  const supabase = await createClient();

  const { data: holder, error: holderError } = await supabase
    .from("holders")
    .select("id")
    .eq("id", parsed.holder_id)
    .single();

  if (holderError || !holder) {
    throw new Error("Titular inválido");
  }

  const institutionFields = await resolveInstitutionFields(supabase, parsed);

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .insert({
      operator_id: operatorId,
      holder_id: parsed.holder_id,
      name: parsed.name,
      type: parsed.type,
      institution: institutionFields.institution,
      bank_id: institutionFields.bank_id,
      crypto_broker_id: institutionFields.crypto_broker_id,
      betting_house_id: institutionFields.betting_house_id,
      default_currency_id: parsed.default_currency_id,
      initial_balance_date: parsed.initial_balance_date,
      status: parsed.status,
      masked_identifier: parsed.masked_identifier ?? null,
      operational_limit: parsed.operational_limit ?? null,
      notes: parsed.notes ?? null,
      preferred_network: parsed.preferred_network ?? null,
      deposit_methods: parsed.deposit_methods ?? null,
      withdrawal_methods: parsed.withdrawal_methods ?? null,
      pending_balance: parsed.pending_balance ?? 0,
    })
    .select()
    .single();

  if (accountError) throw new Error(accountError.message);

  const balanceRows = parsed.currency_balances.map((cb) => ({
    account_id: account.id,
    currency_id: cb.currency_id,
    initial_balance: cb.initial_balance,
    calculated_balance: recalculateBalance(cb.initial_balance),
  }));

  const { error: balancesError } = await supabase
    .from("account_currencies")
    .insert(balanceRows);

  if (balancesError) {
    await supabase.from("accounts").delete().eq("id", account.id);
    throw new Error(balancesError.message);
  }

  revalidatePath("/contas");
  revalidatePath("/titulares");
  revalidatePath("/bancos");
  revalidatePath("/corretoras");
  revalidatePath("/casas-apostas");
  revalidatePath("/");
  return account as Account;
}

export async function updateAccount(input: UpdateAccountInput) {
  const parsed = updateAccountSchema.parse(input);
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("accounts")
    .select("status")
    .eq("id", parsed.id)
    .single();

  if (existingError || !existing) throw new Error("Conta não encontrada");

  const institutionFields = await resolveInstitutionFields(supabase, parsed);

  const { data: account, error } = await supabase
    .from("accounts")
    .update({
      holder_id: parsed.holder_id,
      name: parsed.name,
      type: parsed.type,
      institution: institutionFields.institution,
      bank_id: institutionFields.bank_id,
      crypto_broker_id: institutionFields.crypto_broker_id,
      betting_house_id: institutionFields.betting_house_id,
      default_currency_id: parsed.default_currency_id,
      initial_balance_date: parsed.initial_balance_date,
      status: parsed.status,
      masked_identifier: parsed.masked_identifier ?? null,
      operational_limit: parsed.operational_limit ?? null,
      notes: parsed.notes ?? null,
      preferred_network: parsed.preferred_network ?? null,
      deposit_methods: parsed.deposit_methods ?? null,
      withdrawal_methods: parsed.withdrawal_methods ?? null,
      pending_balance: parsed.pending_balance ?? 0,
    })
    .eq("id", parsed.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (parsed.currency_balances?.length) {
    for (const cb of parsed.currency_balances) {
      const { error: balanceError } = await supabase
        .from("account_currencies")
        .update({
          initial_balance: cb.initial_balance,
          calculated_balance: recalculateBalance(cb.initial_balance),
        })
        .eq("account_id", parsed.id)
        .eq("currency_id", cb.currency_id);

      if (balanceError) throw new Error(balanceError.message);
    }
  }

  revalidatePath("/contas");
  revalidatePath(`/contas/${parsed.id}`);
  revalidatePath("/bancos");
  revalidatePath("/corretoras");
  revalidatePath("/casas-apostas");
  revalidatePath("/");
  return account as Account;
}

export async function listSelectableAccounts(): Promise<AccountWithDetails[]> {
  const accounts = await listAccounts();
  return accounts.filter((a) => a.status !== "closed");
}

export async function deleteAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/contas");
  revalidatePath("/titulares");
  revalidatePath("/");
}