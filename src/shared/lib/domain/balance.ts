import Decimal from "decimal.js";

/**
 * Calcula saldo a partir do saldo inicial.
 * Na Sprint 2+, somará movimentações concluídas.
 */
export function calculateBalanceFromInitial(initialBalance: number | string): number {
  return new Decimal(initialBalance).toNumber();
}

export function recalculateBalance(
  initialBalance: number | string,
  _movementsNet = 0,
): number {
  return new Decimal(initialBalance).plus(_movementsNet).toNumber();
}

export function sumBalancesInBrl(
  balances: Array<{ calculated_balance: number; currency: { last_rate_brl: number } }>,
): number {
  return balances
    .reduce(
      (sum, b) =>
        sum.plus(
          new Decimal(b.calculated_balance).mul(b.currency.last_rate_brl),
        ),
      new Decimal(0),
    )
    .toNumber();
}