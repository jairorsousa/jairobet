import { endOfMonth, format, startOfMonth } from "date-fns";
import Decimal from "decimal.js";
import {
  computeBalanceFromMovements,
  sumBalancesInBrl,
} from "@/shared/lib/domain/balance";
import {
  calculateAccumulatedResult,
  calculateNetCapital,
  calculatePlatformResult,
  calculateROI,
} from "@/shared/lib/domain/result";
import type {
  AccountType,
  AccountWithDetails,
  MovementStatus,
  MovementType,
} from "@/shared/types/database";

export interface ReportMovementRow {
  type: MovementType;
  account_id: string;
  currency_id: string;
  amount: number;
  amount_brl: number;
  direction: "credit" | "debit";
  status: MovementStatus;
  occurred_at: string;
}

export interface ReportPeriod {
  from: string;
  to: string;
}

export interface ResultReport {
  period: ReportPeriod;
  startPatrimony: number;
  endPatrimony: number;
  deposits: number;
  withdrawals: number;
  netCapitalInPeriod: number;
  periodResult: number;
  accumulatedResult: number;
  roi: number | null;
  fees: number;
  cashback: number;
  rakeback: number;
  bonuses: number;
}

export interface AccountReportRow {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  holderId: string;
  holderName: string;
  startBalanceBrl: number;
  endBalanceBrl: number;
  deposits: number;
  withdrawals: number;
  cashback: number;
  rakeback: number;
  bonuses: number;
  fees: number;
  result: number;
}

export interface HolderReportRow {
  holderId: string;
  holderName: string;
  accountCount: number;
  endPatrimony: number;
  deposits: number;
  withdrawals: number;
  netCapitalInPeriod: number;
  result: number;
}

export function defaultReportPeriod(): ReportPeriod {
  return {
    from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  };
}

function inPeriod(date: string, period: ReportPeriod): boolean {
  return date >= period.from && date <= period.to;
}

function accountBalanceBrlAtDate(
  account: AccountWithDetails,
  movements: ReportMovementRow[],
  date: string,
): number {
  return account.balances
    .reduce((sum, balance) => {
      const relevant = movements.filter(
        (m) =>
          m.account_id === account.id &&
          m.currency_id === balance.currency_id &&
          m.occurred_at <= date,
      );
      const amount = computeBalanceFromMovements(
        balance.initial_balance,
        relevant,
      );
      return sum.plus(
        new Decimal(amount).mul(balance.currency.last_rate_brl),
      );
    }, new Decimal(0))
    .toNumber();
}

function equityAtDate(
  accounts: AccountWithDetails[],
  movements: ReportMovementRow[],
  date: string,
): number {
  return accounts.reduce(
    (sum, account) => sum + accountBalanceBrlAtDate(account, movements, date),
    0,
  );
}

function sumCapitalInPeriod(
  movements: ReportMovementRow[],
  accountId: string | null,
  period: ReportPeriod,
  type: "capital_deposit" | "capital_withdrawal",
): number {
  return movements
    .filter(
      (m) =>
        m.type === type &&
        m.status === "completed" &&
        inPeriod(m.occurred_at, period) &&
        (accountId === null || m.account_id === accountId),
    )
    .reduce((sum, m) => sum.plus(m.amount_brl), new Decimal(0))
    .toNumber();
}

function sumTypeInPeriod(
  movements: ReportMovementRow[],
  accountId: string,
  period: ReportPeriod,
  type: MovementType,
): number {
  return movements
    .filter(
      (m) =>
        m.type === type &&
        m.status === "completed" &&
        inPeriod(m.occurred_at, period) &&
        m.account_id === accountId,
    )
    .reduce((sum, m) => sum.plus(m.amount_brl), new Decimal(0))
    .toNumber();
}

export function buildResultReport(
  accounts: AccountWithDetails[],
  movements: ReportMovementRow[],
  period: ReportPeriod,
): ResultReport {
  const active = accounts.filter((a) => a.status !== "closed");
  const startPatrimony = equityAtDate(active, movements, period.from);
  const endPatrimony = equityAtDate(active, movements, period.to);
  const deposits = sumCapitalInPeriod(movements, null, period, "capital_deposit");
  const withdrawals = sumCapitalInPeriod(
    movements,
    null,
    period,
    "capital_withdrawal",
  );
  const netCapitalInPeriod = calculateNetCapital(deposits, withdrawals);

  const startNetCapital = movements
    .filter(
      (m) =>
        (m.type === "capital_deposit" || m.type === "capital_withdrawal") &&
        m.status === "completed" &&
        m.occurred_at < period.from,
    )
    .reduce((sum, m) => {
      if (m.type === "capital_deposit") return sum.plus(m.amount_brl);
      return sum.minus(m.amount_brl);
    }, new Decimal(0))
    .toNumber();

  const endNetCapital = startNetCapital + netCapitalInPeriod;
  const startResult = calculateAccumulatedResult(startPatrimony, startNetCapital);
  const accumulatedResult = calculateAccumulatedResult(
    endPatrimony,
    endNetCapital,
  );
  const periodResult = new Decimal(accumulatedResult)
    .minus(startResult)
    .toNumber();

  const fees = movements
    .filter(
      (m) =>
        m.type === "fee" &&
        m.status === "completed" &&
        inPeriod(m.occurred_at, period),
    )
    .reduce((sum, m) => sum.plus(m.amount_brl), new Decimal(0))
    .toNumber();

  const cashback = movements
    .filter(
      (m) =>
        m.type === "cashback" &&
        m.status === "completed" &&
        m.direction === "credit" &&
        inPeriod(m.occurred_at, period),
    )
    .reduce((sum, m) => sum.plus(m.amount_brl), new Decimal(0))
    .toNumber();

  const rakeback = movements
    .filter(
      (m) =>
        m.type === "rakeback" &&
        m.status === "completed" &&
        m.direction === "credit" &&
        inPeriod(m.occurred_at, period),
    )
    .reduce((sum, m) => sum.plus(m.amount_brl), new Decimal(0))
    .toNumber();

  const bonuses = movements
    .filter(
      (m) =>
        m.type === "bonus" &&
        m.status === "completed" &&
        m.direction === "credit" &&
        inPeriod(m.occurred_at, period),
    )
    .reduce((sum, m) => sum.plus(m.amount_brl), new Decimal(0))
    .toNumber();

  return {
    period,
    startPatrimony,
    endPatrimony,
    deposits,
    withdrawals,
    netCapitalInPeriod,
    periodResult,
    accumulatedResult,
    roi: calculateROI(accumulatedResult, endNetCapital),
    fees,
    cashback,
    rakeback,
    bonuses,
  };
}

export function buildAccountReportRows(
  accounts: AccountWithDetails[],
  movements: ReportMovementRow[],
  period: ReportPeriod,
  accountType?: AccountType,
): AccountReportRow[] {
  const filtered = accounts.filter(
    (a) => a.status !== "closed" && (!accountType || a.type === accountType),
  );

  return filtered
    .map((account) => {
      const startBalanceBrl = accountBalanceBrlAtDate(
        account,
        movements,
        period.from,
      );
      const endBalanceBrl = accountBalanceBrlAtDate(
        account,
        movements,
        period.to,
      );
      const deposits = sumCapitalInPeriod(
        movements,
        account.id,
        period,
        "capital_deposit",
      );
      const withdrawals = sumCapitalInPeriod(
        movements,
        account.id,
        period,
        "capital_withdrawal",
      );
      const cashback = sumTypeInPeriod(
        movements,
        account.id,
        period,
        "cashback",
      );
      const rakeback = sumTypeInPeriod(
        movements,
        account.id,
        period,
        "rakeback",
      );
      const bonuses = sumTypeInPeriod(movements, account.id, period, "bonus");
      const fees = sumTypeInPeriod(movements, account.id, period, "fee");

      return {
        accountId: account.id,
        accountName: account.name,
        accountType: account.type,
        holderId: account.holder_id,
        holderName: account.holder.name,
        startBalanceBrl,
        endBalanceBrl,
        deposits,
        withdrawals,
        cashback,
        rakeback,
        bonuses,
        fees,
        result: calculatePlatformResult({
          initialBalanceBrl: startBalanceBrl,
          finalBalanceBrl: endBalanceBrl,
          depositsBrl: deposits,
          withdrawalsBrl: withdrawals,
          cashbackBrl: cashback,
          rakebackBrl: rakeback,
          bonusesBrl: bonuses,
          feesBrl: fees,
        }),
      };
    })
    .sort((a, b) => b.result - a.result);
}

export function buildHolderReportRows(
  accounts: AccountWithDetails[],
  movements: ReportMovementRow[],
  period: ReportPeriod,
): HolderReportRow[] {
  const active = accounts.filter((a) => a.status !== "closed");
  const holderMap = new Map<string, HolderReportRow>();

  for (const account of active) {
    const existing = holderMap.get(account.holder_id);
    const endPatrimony = sumBalancesInBrl(account.balances);
    const deposits = sumCapitalInPeriod(
      movements,
      account.id,
      period,
      "capital_deposit",
    );
    const withdrawals = sumCapitalInPeriod(
      movements,
      account.id,
      period,
      "capital_withdrawal",
    );
    const startBalance = accountBalanceBrlAtDate(
      account,
      movements,
      period.from,
    );
    const endBalance = accountBalanceBrlAtDate(account, movements, period.to);
    const accountResult = new Decimal(endBalance).minus(startBalance).toNumber();

    if (!existing) {
      holderMap.set(account.holder_id, {
        holderId: account.holder_id,
        holderName: account.holder.name,
        accountCount: 1,
        endPatrimony,
        deposits,
        withdrawals,
        netCapitalInPeriod: calculateNetCapital(deposits, withdrawals),
        result: accountResult,
      });
    } else {
      existing.accountCount += 1;
      existing.endPatrimony += endPatrimony;
      existing.deposits += deposits;
      existing.withdrawals += withdrawals;
      existing.netCapitalInPeriod = calculateNetCapital(
        existing.deposits,
        existing.withdrawals,
      );
      existing.result += accountResult;
    }
  }

  return [...holderMap.values()].sort((a, b) => b.endPatrimony - a.endPatrimony);
}