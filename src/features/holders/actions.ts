"use server";

import { revalidatePath } from "next/cache";
import { getOperatorId } from "@/shared/lib/auth/get-operator";
import { createClient } from "@/shared/lib/supabase/server";
import type { Holder, HolderWithStats } from "@/shared/types/database";
import {
  createHolderSchema,
  updateHolderSchema,
  type CreateHolderInput,
  type UpdateHolderInput,
} from "./schemas";

export async function listHolders(): Promise<HolderWithStats[]> {
  const supabase = await createClient();

  const { data: holders, error } = await supabase
    .from("holders")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);

  const { data: accountCounts, error: countError } = await supabase
    .from("accounts")
    .select("holder_id");

  if (countError) throw new Error(countError.message);

  const countMap = (accountCounts ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.holder_id] = (acc[row.holder_id] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (holders as Holder[]).map((holder) => ({
    ...holder,
    account_count: countMap[holder.id] ?? 0,
  }));
}

export async function listActiveHolders(): Promise<Holder[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("holders")
    .select("*")
    .eq("status", "active")
    .order("name");

  if (error) throw new Error(error.message);
  return data as Holder[];
}

export async function createHolder(input: CreateHolderInput) {
  const parsed = createHolderSchema.parse(input);
  const operatorId = await getOperatorId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("holders")
    .insert({
      operator_id: operatorId,
      name: parsed.name,
      notes: parsed.notes ?? null,
      status: parsed.status,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/titulares");
  revalidatePath("/contas");
  return data as Holder;
}

export async function updateHolder(input: UpdateHolderInput) {
  const parsed = updateHolderSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("holders")
    .update({
      name: parsed.name,
      notes: parsed.notes ?? null,
      status: parsed.status,
    })
    .eq("id", parsed.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/titulares");
  revalidatePath("/contas");
  return data as Holder;
}

export async function deleteHolder(id: string) {
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("accounts")
    .select("*", { count: "exact", head: true })
    .eq("holder_id", id);

  if (countError) throw new Error(countError.message);
  if (count && count > 0) {
    throw new Error("Titular possui contas vinculadas. Inative em vez de excluir.");
  }

  const { error } = await supabase.from("holders").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/titulares");
}