import { createClient } from "@/shared/lib/supabase/server";

export async function recalculateAccountCurrencyBalance(
  accountId: string,
  currencyId: string,
) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("recalculate_account_currency_balance", {
    p_account_id: accountId,
    p_currency_id: currencyId,
  });

  if (error) throw new Error(error.message);
}

export async function recalculateBalancesForAccounts(
  pairs: Array<{ accountId: string; currencyId: string }>,
) {
  const unique = new Map(
    pairs.map((p) => [`${p.accountId}:${p.currencyId}`, p]),
  );
  for (const pair of unique.values()) {
    await recalculateAccountCurrencyBalance(pair.accountId, pair.currencyId);
  }
}
