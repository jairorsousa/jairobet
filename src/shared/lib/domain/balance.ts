import Decimal from "decimal.js";
import type { Movement, MovementDirection, MovementStatus } from "@/shared/types/database";

export function computeBalanceFromMovements(
  initialBalance: number | string,
  movements: Array<{
    amount: number;
    direction: MovementDirection;
    status: MovementStatus;
  }>,
): number {
  return movements
    .reduce((balance, movement) => {
      const amount = new Decimal(movement.amount);
      if (movement.direction === "debit") {
        return balance.minus(amount);
      }
      if (movement.status === "completed") {
        return balance.plus(amount);
      }
      return balance;
    }, new Decimal(initialBalance))
    .toNumber();
}

export function recalculateBalance(
  initialBalance: number | string,
  movementsNet: number | string = 0,
): number {
  return new Decimal(initialBalance).plus(movementsNet).toNumber();
}

export function accountHasBalance(account: {
  balances: Array<{ calculated_balance: number }>;
  pending_balance?: number;
}): boolean {
  if ((account.pending_balance ?? 0) > 0) return true;
  return account.balances.some((balance) => balance.calculated_balance !== 0);
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

export function calculateAmountBrl(
  amount: number,
  currencyCode: string,
  exchangeRate: number,
): number {
  if (currencyCode === "BRL") {
    return new Decimal(amount).toNumber();
  }
  return new Decimal(amount).mul(exchangeRate).toNumber();
}

export function netMovementEffect(movements: Movement[]): number {
  return computeBalanceFromMovements(0, movements);
}