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

export function isReceivedBonusMovement(movement: MovementSummary): boolean {
  if (movement.direction !== "credit") return false;
  if (
    movement.type !== "cashback" &&
    movement.type !== "rakeback" &&
    movement.type !== "bonus"
  ) {
    return false;
  }

  if (movement.status === "completed") return true;

  const meta = movement.metadata ?? {};
  if (movement.type === "cashback") {
    return meta.cashback_status === "recebido";
  }
  if (movement.type === "rakeback") {
    return meta.rakeback_status === "recebido";
  }
  if (movement.type === "bonus") {
    return (
      meta.bonus_status === "creditado" || meta.bonus_status === "utilizado"
    );
  }

  return false;
}

export interface ReceivedBonusesBreakdown {
  cashback: number;
  rakeback: number;
  bonus: number;
  total: number;
}

export function calculateReceivedBonusesBreakdown(
  movements: MovementSummary[],
): ReceivedBonusesBreakdown {
  const breakdown = { cashback: 0, rakeback: 0, bonus: 0 };

  for (const movement of movements) {
    if (!isReceivedBonusMovement(movement)) continue;

    if (movement.type === "cashback") {
      breakdown.cashback += movement.amount_brl;
    } else if (movement.type === "rakeback") {
      breakdown.rakeback += movement.amount_brl;
    } else if (movement.type === "bonus") {
      breakdown.bonus += movement.amount_brl;
    }
  }

  return {
    ...breakdown,
    total: breakdown.cashback + breakdown.rakeback + breakdown.bonus,
  };
}

export function calculateRealizedCashback(movements: MovementSummary[]): number {
  return calculateReceivedBonusesBreakdown(movements).cashback;
}

export function calculateRealizedRakeback(movements: MovementSummary[]): number {
  return calculateReceivedBonusesBreakdown(movements).rakeback;
}

export function calculateRealizedBonuses(movements: MovementSummary[]): number {
  return calculateReceivedBonusesBreakdown(movements).bonus;
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