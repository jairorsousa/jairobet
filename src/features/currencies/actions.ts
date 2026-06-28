"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import type { Currency } from "@/shared/types/database";
import {
  updateCurrencyRateSchema,
  type UpdateCurrencyRateInput,
} from "./schemas";

export async function listCurrencies(): Promise<Currency[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("currencies")
    .select("*")
    .order("code");

  if (error) throw new Error(error.message);
  return data as Currency[];
}

export async function updateCurrencyRate(input: UpdateCurrencyRateInput) {
  const parsed = updateCurrencyRateSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("currencies")
    .update({ last_rate_brl: parsed.last_rate_brl })
    .eq("id", parsed.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/configuracoes/moedas");
  revalidatePath("/contas");
  revalidatePath("/");
  return data as Currency;
}