import Decimal from "decimal.js";
import type { MovementType } from "@/shared/types/database";

export interface MovementSummary {
  type: MovementType;
  amount_brl: number;
  direction: "credit" | "debit";
  status: string;
  metadata?: Record<string, unknown>;
}

export interface AccountEquityInput {
  calculated_balance: number;
  currency: { last_rate_brl: number };
}

export function calculateOperationalEquity(
  accounts: AccountEquityInput[],
): number {
  return accounts
    .reduce(
      (sum, account) =>
        sum.plus(
          new Decimal(account.calculated_balance).mul(
            account.currency.last_rate_brl,
          ),
        ),
      new Decimal(0),
    )
    .toNumber();
}

export function calculateNetCapital(
  deposits: number | string,
  withdrawals: number | string,
): number {
  return new Decimal(deposits).minus(withdrawals).toNumber();
}

export function calculateAccumulatedResult(
  operationalEquity: number | string,
  netCapital: number | string,
): number {
  return new Decimal(operationalEquity).minus(netCapital).toNumber();
}

export function calculateROI(
  accumulatedResult: number | string,
  netCapital: number | string,
): number | null {
  const capital = new Decimal(netCapital);
  if (capital.lte(0)) return null;
  return new Decimal(accumulatedResult)
    .div(capital)
    .mul(100)
    .toDecimalPlaces(2)
    .toNumber();
}

export function sumMovementsByType(
  movements: MovementSummary[],
  type: MovementType,
): number {
  return movements
    .filter((m) => m.type === type)
    .reduce((sum, m) => {
      const signed =
        m.direction === "credit" ? m.amount_brl : -m.amount_brl;
      return sum.plus(signed);
    }, new Decimal(0))
    .toNumber();
}

export function calculateRealizedCashback(movements: MovementSummary[]): number {
  return movements
    .filter(
      (m) =>
        m.type === "cashback" &&
        m.status === "completed" &&
        m.direction === "credit",
    )
    .reduce((sum, m) => sum.plus(m.amount_brl), new Decimal(0))
    .toNumber();
}

export function calculateTotalFees(movements: MovementSummary[]): number {
  return movements
    .filter((m) => m.type === "fee")
    .reduce((sum, m) => sum.plus(m.amount_brl), new Decimal(0))
    .toNumber();
}

export interface PlatformResultInput {
  initialBalanceBrl: number;
  finalBalanceBrl: number;
  depositsBrl: number;
  withdrawalsBrl: number;
  cashbackBrl: number;
  rakebackBrl?: number;
  bonusesBrl: number;
  feesBrl: number;
}

export function calculatePlatformResult(input: PlatformResultInput): number {
  return new Decimal(input.finalBalanceBrl)
    .minus(input.initialBalanceBrl)
    .minus(input.depositsBrl)
    .plus(input.withdrawalsBrl)
    .plus(input.cashbackBrl)
    .plus(input.rakebackBrl ?? 0)
    .plus(input.bonusesBrl)
    .minus(input.feesBrl)
    .toNumber();
}