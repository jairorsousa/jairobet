import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subDays,
} from "date-fns";
import Decimal from "decimal.js";
import {
  computeBalanceFromMovements,
  sumBalancesInBrl,
} from "@/shared/lib/domain/balance";
import {
  calculateAccumulatedResult,
  calculateNetCapital,
  calculateOperationalEquity,
  calculateReceivedBonusesBreakdown,
  calculateROI,
  calculateTotalFees,
  type MovementSummary,
  type ReceivedBonusesBreakdown,
} from "@/shared/lib/domain/result";
import type {
  AccountType,
  AccountWithDetails,
  MovementDirection,
  MovementStatus,
  MovementType,
  PendingTransfer,
} from "@/shared/types/database";

export type DashboardPeriod = "7d" | "30d" | "month" | "year";

export interface DashboardMovementRow {
  type: MovementType;
  account_id: string;
  currency_id: string;
  amount: number;
  amount_brl: number;
  direction: MovementDirection;
  status: MovementStatus;
  occurred_at: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardKpis {
  operationalEquity: number;
  inTransit: number;
  totalPatrimony: number;
  totalDeposits: number;
  totalWithdrawals: number;
  netCapital: number;
  accumulatedResult: number;
  monthResult: number;
  roi: number | null;
  totalFees: number;
  receivedBonuses: ReceivedBonusesBreakdown;
  activeAccountsByType: Record<AccountType, number>;
}

export interface PieSlice {
  name: string;
  value: number;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  patrimony: number;
  netCapital: number;
  result: number;
  dailyResult: number;
}

export interface DashboardComputed {
  kpis: DashboardKpis;
  equityByHolder: PieSlice[];
  equityByAccountType: PieSlice[];
  receivedBonusesByType: PieSlice[];
  timeSeries: TimeSeriesPoint[];
}

function todayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function filterAccountsByHolder(
  accounts: AccountWithDetails[],
  holderId: string,
): AccountWithDetails[] {
  if (holderId === "all") return accounts;
  return accounts.filter((a) => a.holder_id === holderId);
}

function accountIds(accounts: AccountWithDetails[]): Set<string> {
  return new Set(accounts.map((a) => a.id));
}

function filterMovementsByAccounts(
  movements: DashboardMovementRow[],
  ids: Set<string>,
): DashboardMovementRow[] {
  return movements.filter((m) => ids.has(m.account_id));
}

function toMovementSummaries(
  movements: DashboardMovementRow[],
): MovementSummary[] {
  return movements.map((m) => ({
    type: m.type,
    amount_brl: m.amount_brl,
    direction: m.direction,
    status: m.status,
    metadata: m.metadata,
  }));
}

export function calculateInTransit(
  transfers: PendingTransfer[],
  holderId: string,
): number {
  const filtered =
    holderId === "all"
      ? transfers
      : transfers.filter((t) => t.account.holder_id === holderId);

  return filtered
    .reduce((sum, t) => sum.plus(t.amount_brl), new Decimal(0))
    .toNumber();
}

export function buildReceivedBonusesByType(
  breakdown: ReceivedBonusesBreakdown,
): PieSlice[] {
  return [
    { name: "Cashback", value: breakdown.cashback },
    { name: "Rakeback", value: breakdown.rakeback },
    { name: "Bônus", value: breakdown.bonus },
  ].filter((slice) => slice.value > 0);
}

function sumCapital(
  movements: DashboardMovementRow[],
  type: "capital_deposit" | "capital_withdrawal",
): number {
  return movements
    .filter((m) => m.type === type && m.status === "completed")
    .reduce((sum, m) => sum.plus(m.amount_brl), new Decimal(0))
    .toNumber();
}

function equityInputsFromAccounts(accounts: AccountWithDetails[]) {
  return accounts.flatMap((account) =>
    account.balances.map((balance) => ({
      calculated_balance: balance.calculated_balance,
      currency: { last_rate_brl: balance.currency.last_rate_brl },
    })),
  );
}

export function buildEquityByHolder(
  accounts: AccountWithDetails[],
): PieSlice[] {
  const totals = new Map<string, number>();

  for (const account of accounts) {
    const brl = sumBalancesInBrl(account.balances);
    totals.set(
      account.holder.name,
      (totals.get(account.holder.name) ?? 0) + brl,
    );
  }

  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function buildEquityByAccountType(
  accounts: AccountWithDetails[],
  labels: Record<AccountType, string>,
): PieSlice[] {
  const totals: Record<AccountType, number> = {
    bank: 0,
    crypto: 0,
    betting: 0,
  };

  for (const account of accounts) {
    totals[account.type] += sumBalancesInBrl(account.balances);
  }

  return (Object.keys(totals) as AccountType[])
    .map((type) => ({ name: labels[type], value: totals[type] }))
    .filter((s) => s.value > 0);
}

function getPeriodRange(period: DashboardPeriod): { start: string; end: string } {
  const end = todayString();

  switch (period) {
    case "7d":
      return { start: format(subDays(new Date(), 6), "yyyy-MM-dd"), end };
    case "30d":
      return { start: format(subDays(new Date(), 29), "yyyy-MM-dd"), end };
    case "month":
      return {
        start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
        end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
      };
    case "year":
      return {
        start: format(startOfYear(new Date()), "yyyy-MM-dd"),
        end: format(endOfYear(new Date()), "yyyy-MM-dd"),
      };
  }
}

function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(start + "T12:00:00");
  const limit = new Date(end + "T12:00:00");

  while (cursor <= limit) {
    dates.push(format(cursor, "yyyy-MM-dd"));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function computeEquityAtDate(
  accounts: AccountWithDetails[],
  movements: DashboardMovementRow[],
  date: string,
): number {
  return accounts
    .reduce((total, account) => {
      const accountTotal = account.balances.reduce((sum, balance) => {
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
      }, new Decimal(0));
      return total.plus(accountTotal);
    }, new Decimal(0))
    .toNumber();
}

function computeNetCapitalAtDate(
  movements: DashboardMovementRow[],
  date: string,
): number {
  const deposits = movements
    .filter(
      (m) =>
        m.type === "capital_deposit" &&
        m.status === "completed" &&
        m.occurred_at <= date,
    )
    .reduce((sum, m) => sum.plus(m.amount_brl), new Decimal(0));

  const withdrawals = movements
    .filter(
      (m) =>
        m.type === "capital_withdrawal" &&
        m.status === "completed" &&
        m.occurred_at <= date,
    )
    .reduce((sum, m) => sum.plus(m.amount_brl), new Decimal(0));

  return deposits.minus(withdrawals).toNumber();
}

export function buildTimeSeries(
  accounts: AccountWithDetails[],
  movements: DashboardMovementRow[],
  period: DashboardPeriod,
): TimeSeriesPoint[] {
  const { start, end } = getPeriodRange(period);
  const dates = enumerateDates(start, end);

  if (dates.length === 0) return [];

  const step = dates.length > 60 ? Math.ceil(dates.length / 30) : 1;
  const sampled = dates.filter((_, i) => i % step === 0 || i === dates.length - 1);

  return sampled.map((date) => {
    const patrimony = computeEquityAtDate(accounts, movements, date);
    const netCapital = computeNetCapitalAtDate(movements, date);
    const result = calculateAccumulatedResult(patrimony, netCapital);
    const previousDate = format(
      subDays(new Date(date + "T12:00:00"), 1),
      "yyyy-MM-dd",
    );
    const previousPatrimony = computeEquityAtDate(
      accounts,
      movements,
      previousDate,
    );
    const previousNetCapital = computeNetCapitalAtDate(
      movements,
      previousDate,
    );
    const previousResult = calculateAccumulatedResult(
      previousPatrimony,
      previousNetCapital,
    );

    return {
      date,
      label: format(new Date(date + "T12:00:00"), "dd/MM"),
      patrimony,
      netCapital,
      result,
      dailyResult: new Decimal(result).minus(previousResult).toNumber(),
    };
  });
}

function countActiveByType(
  accounts: AccountWithDetails[],
): Record<AccountType, number> {
  const counts: Record<AccountType, number> = {
    bank: 0,
    crypto: 0,
    betting: 0,
  };

  for (const account of accounts) {
    if (account.status === "active") {
      counts[account.type] += 1;
    }
  }

  return counts;
}

export function computeDashboard(
  accounts: AccountWithDetails[],
  movements: DashboardMovementRow[],
  pendingTransfers: PendingTransfer[],
  holderId: string,
  period: DashboardPeriod,
  accountTypeLabels: Record<AccountType, string>,
): DashboardComputed {
  const filteredAccounts = filterAccountsByHolder(accounts, holderId);
  const ids = accountIds(filteredAccounts);
  const filteredMovements = filterMovementsByAccounts(movements, ids);
  const summaries = toMovementSummaries(filteredMovements);

  const operationalEquity = calculateOperationalEquity(
    equityInputsFromAccounts(filteredAccounts),
  );
  const inTransit = calculateInTransit(pendingTransfers, holderId);
  const totalDeposits = sumCapital(filteredMovements, "capital_deposit");
  const totalWithdrawals = sumCapital(filteredMovements, "capital_withdrawal");
  const netCapital = calculateNetCapital(totalDeposits, totalWithdrawals);
  const accumulatedResult = calculateAccumulatedResult(
    operationalEquity + inTransit,
    netCapital,
  );

  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthStartEquity = computeEquityAtDate(
    filteredAccounts,
    filteredMovements,
    monthStart,
  );
  const monthStartCapital = computeNetCapitalAtDate(
    filteredMovements,
    monthStart,
  );
  const monthStartResult = calculateAccumulatedResult(
    monthStartEquity,
    monthStartCapital,
  );
  const monthResult = new Decimal(accumulatedResult)
    .minus(monthStartResult)
    .toNumber();

  const timeSeries = buildTimeSeries(
    filteredAccounts,
    filteredMovements,
    period,
  );
  const receivedBonuses = calculateReceivedBonusesBreakdown(summaries);

  return {
    kpis: {
      operationalEquity,
      inTransit,
      totalPatrimony: operationalEquity + inTransit,
      totalDeposits,
      totalWithdrawals,
      netCapital,
      accumulatedResult,
      monthResult,
      roi: calculateROI(accumulatedResult, netCapital),
      totalFees: calculateTotalFees(summaries),
      receivedBonuses,
      activeAccountsByType: countActiveByType(filteredAccounts),
    },
    equityByHolder: buildEquityByHolder(
      holderId === "all" ? accounts : filteredAccounts,
    ),
    equityByAccountType: buildEquityByAccountType(
      filteredAccounts,
      accountTypeLabels,
    ),
    receivedBonusesByType: buildReceivedBonusesByType(receivedBonuses),
    timeSeries,
  };
}
