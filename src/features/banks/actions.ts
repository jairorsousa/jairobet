"use server";

import { revalidatePath } from "next/cache";
import { getOperatorId } from "@/shared/lib/auth/get-operator";
import { createClient } from "@/shared/lib/supabase/server";
import type { Bank, BankWithStats } from "@/shared/types/database";
import {
  createBankSchema,
  updateBankSchema,
  type CreateBankInput,
  type UpdateBankInput,
} from "./schemas";

export async function listBanks(): Promise<BankWithStats[]> {
  const supabase = await createClient();

  const { data: banks, error } = await supabase
    .from("banks")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);

  const { data: accountCounts, error: countError } = await supabase
    .from("accounts")
    .select("bank_id")
    .not("bank_id", "is", null);

  if (countError) throw new Error(countError.message);

  const countMap = (accountCounts ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      if (row.bank_id) {
        acc[row.bank_id] = (acc[row.bank_id] ?? 0) + 1;
      }
      return acc;
    },
    {},
  );

  return (banks as Bank[]).map((bank) => ({
    ...bank,
    account_count: countMap[bank.id] ?? 0,
  }));
}

export async function listActiveBanks(): Promise<Bank[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("banks")
    .select("*")
    .eq("status", "active")
    .order("name");

  if (error) throw new Error(error.message);
  return data as Bank[];
}

export async function createBank(input: CreateBankInput) {
  const parsed = createBankSchema.parse(input);
  const operatorId = await getOperatorId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("banks")
    .insert({
      operator_id: operatorId,
      name: parsed.name,
      notes: parsed.notes ?? null,
      status: parsed.status,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/bancos");
  revalidatePath("/contas");
  return data as Bank;
}

export async function updateBank(input: UpdateBankInput) {
  const parsed = updateBankSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("banks")
    .update({
      name: parsed.name,
      notes: parsed.notes ?? null,
      status: parsed.status,
    })
    .eq("id", parsed.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/bancos");
  revalidatePath("/contas");
  return data as Bank;
}

export async function deleteBank(id: string) {
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("accounts")
    .select("*", { count: "exact", head: true })
    .eq("bank_id", id);

  if (countError) throw new Error(countError.message);
  if (count && count > 0) {
    throw new Error("Banco possui contas vinculadas. Inative em vez de excluir.");
  }

  const { error } = await supabase.from("banks").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/bancos");
}