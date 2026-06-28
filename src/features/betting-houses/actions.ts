"use server";

import { revalidatePath } from "next/cache";
import { getOperatorId } from "@/shared/lib/auth/get-operator";
import { createClient } from "@/shared/lib/supabase/server";
import type { BettingHouse, BettingHouseWithStats } from "@/shared/types/database";
import {
  createBettingHouseSchema,
  updateBettingHouseSchema,
  type CreateBettingHouseInput,
  type UpdateBettingHouseInput,
} from "./schemas";

export async function listBettingHouses(): Promise<BettingHouseWithStats[]> {
  const supabase = await createClient();

  const { data: houses, error } = await supabase
    .from("betting_houses")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);

  const { data: accountCounts, error: countError } = await supabase
    .from("accounts")
    .select("betting_house_id")
    .not("betting_house_id", "is", null);

  if (countError) throw new Error(countError.message);

  const countMap = (accountCounts ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      if (row.betting_house_id) {
        acc[row.betting_house_id] = (acc[row.betting_house_id] ?? 0) + 1;
      }
      return acc;
    },
    {},
  );

  return (houses as BettingHouse[]).map((house) => ({
    ...house,
    account_count: countMap[house.id] ?? 0,
  }));
}

export async function listActiveBettingHouses(): Promise<BettingHouse[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("betting_houses")
    .select("*")
    .eq("status", "active")
    .order("name");

  if (error) throw new Error(error.message);
  return data as BettingHouse[];
}

export async function createBettingHouse(input: CreateBettingHouseInput) {
  const parsed = createBettingHouseSchema.parse(input);
  const operatorId = await getOperatorId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("betting_houses")
    .insert({
      operator_id: operatorId,
      name: parsed.name,
      notes: parsed.notes ?? null,
      status: parsed.status,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/casas-apostas");
  revalidatePath("/contas");
  return data as BettingHouse;
}

export async function updateBettingHouse(input: UpdateBettingHouseInput) {
  const parsed = updateBettingHouseSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("betting_houses")
    .update({
      name: parsed.name,
      notes: parsed.notes ?? null,
      status: parsed.status,
    })
    .eq("id", parsed.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/casas-apostas");
  revalidatePath("/contas");
  return data as BettingHouse;
}

export async function deleteBettingHouse(id: string) {
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("accounts")
    .select("*", { count: "exact", head: true })
    .eq("betting_house_id", id);

  if (countError) throw new Error(countError.message);
  if (count && count > 0) {
    throw new Error(
      "Casa de apostas possui contas vinculadas. Inative em vez de excluir.",
    );
  }

  const { error } = await supabase.from("betting_houses").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/casas-apostas");
}