import { computeBalanceFromMovements } from "@/shared/lib/domain/balance";
import { createClient } from "@/shared/lib/supabase/server";

export async function recalculateAccountCurrencyBalance(
  accountId: string,
  currencyId: string,
) {
  const supabase = await createClient();

  const { data: accountCurrency, error: acError } = await supabase
    .from("account_currencies")
    .select("initial_balance")
    .eq("account_id", accountId)
    .eq("currency_id", currencyId)
    .single();

  if (acError || !accountCurrency) return;

  const { data: movements, error: movError } = await supabase
    .from("movements")
    .select("amount, direction, status")
    .eq("account_id", accountId)
    .eq("currency_id", currencyId);

  if (movError) throw new Error(movError.message);

  const calculated = computeBalanceFromMovements(
    accountCurrency.initial_balance,
    movements ?? [],
  );

  const { error: updateError } = await supabase
    .from("account_currencies")
    .update({ calculated_balance: calculated })
    .eq("account_id", accountId)
    .eq("currency_id", currencyId);

  if (updateError) throw new Error(updateError.message);
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