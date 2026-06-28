"use server";

import { revalidatePath } from "next/cache";
import { getOperatorId } from "@/shared/lib/auth/get-operator";
import { createClient } from "@/shared/lib/supabase/server";
import type { CryptoBroker, CryptoBrokerWithStats } from "@/shared/types/database";
import {
  createCryptoBrokerSchema,
  updateCryptoBrokerSchema,
  type CreateCryptoBrokerInput,
  type UpdateCryptoBrokerInput,
} from "./schemas";

export async function listCryptoBrokers(): Promise<CryptoBrokerWithStats[]> {
  const supabase = await createClient();

  const { data: brokers, error } = await supabase
    .from("crypto_brokers")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);

  const { data: accountCounts, error: countError } = await supabase
    .from("accounts")
    .select("crypto_broker_id")
    .not("crypto_broker_id", "is", null);

  if (countError) throw new Error(countError.message);

  const countMap = (accountCounts ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      if (row.crypto_broker_id) {
        acc[row.crypto_broker_id] = (acc[row.crypto_broker_id] ?? 0) + 1;
      }
      return acc;
    },
    {},
  );

  return (brokers as CryptoBroker[]).map((broker) => ({
    ...broker,
    account_count: countMap[broker.id] ?? 0,
  }));
}

export async function listActiveCryptoBrokers(): Promise<CryptoBroker[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("crypto_brokers")
    .select("*")
    .eq("status", "active")
    .order("name");

  if (error) throw new Error(error.message);
  return data as CryptoBroker[];
}

export async function createCryptoBroker(input: CreateCryptoBrokerInput) {
  const parsed = createCryptoBrokerSchema.parse(input);
  const operatorId = await getOperatorId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("crypto_brokers")
    .insert({
      operator_id: operatorId,
      name: parsed.name,
      notes: parsed.notes ?? null,
      status: parsed.status,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/corretoras");
  revalidatePath("/contas");
  return data as CryptoBroker;
}

export async function updateCryptoBroker(input: UpdateCryptoBrokerInput) {
  const parsed = updateCryptoBrokerSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("crypto_brokers")
    .update({
      name: parsed.name,
      notes: parsed.notes ?? null,
      status: parsed.status,
    })
    .eq("id", parsed.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/corretoras");
  revalidatePath("/contas");
  return data as CryptoBroker;
}

export async function deleteCryptoBroker(id: string) {
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("accounts")
    .select("*", { count: "exact", head: true })
    .eq("crypto_broker_id", id);

  if (countError) throw new Error(countError.message);
  if (count && count > 0) {
    throw new Error(
      "Corretora possui contas vinculadas. Inative em vez de excluir.",
    );
  }

  const { error } = await supabase.from("crypto_brokers").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/corretoras");
}