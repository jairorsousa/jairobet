import { describe, expect, it } from "vitest";
import {
  buildEquityByHolder,
  buildTimeSeries,
  calculateInTransit,
  computeDashboard,
  type DashboardMovementRow,
} from "./compute-dashboard";
import type {
  AccountType,
  AccountWithDetails,
  PendingTransfer,
} from "@/shared/types/database";

const currency = {
  id: "brl",
  code: "BRL",
  name: "Real",
  symbol: "R$",
  type: "fiat" as const,
  decimal_places: 2,
  last_rate_brl: 1,
  created_at: "",
  updated_at: "",
};

function makeAccount(
  id: string,
  holderId: string,
  holderName: string,
  type: AccountType,
  balance: number,
): AccountWithDetails {
  return {
    id,
    operator_id: "op",
    holder_id: holderId,
    name: `Conta ${id}`,
    type,
    institution: "Test",
    bank_id: null,
    crypto_broker_id: null,
    betting_house_id: null,
    default_currency_id: "brl",
    initial_balance_date: "2026-01-01",
    status: "active",
    masked_identifier: null,
    operational_limit: null,
    notes: null,
    preferred_network: null,
    deposit_methods: null,
    withdrawal_methods: null,
    pending_balance: 0,
    created_at: "",
    updated_at: "",
    holder: { id: holderId, name: holderName, status: "active" },
    default_currency: currency,
    balances: [
      {
        id: `bal-${id}`,
        account_id: id,
        currency_id: "brl",
        initial_balance: balance,
        calculated_balance: balance,
        created_at: "",
        updated_at: "",
        currency,
      },
    ],
  };
}

describe("computeDashboard", () => {
  const accounts = [
    makeAccount("a1", "h1", "Titular A", "bank", 5000),
    makeAccount("a2", "h2", "Titular B", "betting", 3000),
  ];

  const movements: DashboardMovementRow[] = [
    {
      type: "capital_deposit",
      account_id: "a1",
      currency_id: "brl",
      amount: 10000,
      amount_brl: 10000,
      direction: "credit",
      status: "completed",
      occurred_at: "2026-01-15",
    },
    {
      type: "capital_withdrawal",
      account_id: "a1",
      currency_id: "brl",
      amount: 2000,
      amount_brl: 2000,
      direction: "debit",
      status: "completed",
      occurred_at: "2026-02-01",
    },
    {
      type: "fee",
      account_id: "a2",
      currency_id: "brl",
      amount: 50,
      amount_brl: 50,
      direction: "debit",
      status: "completed",
      occurred_at: "2026-03-01",
    },
    {
      type: "cashback",
      account_id: "a2",
      currency_id: "brl",
      amount: 100,
      amount_brl: 100,
      direction: "credit",
      status: "completed",
      occurred_at: "2026-03-10",
    },
  ];

  const pendingTransfers = [
    {
      id: "t1",
      amount_brl: 500,
      account: { holder_id: "h1" },
    },
  ] as unknown as PendingTransfer[];

  it("computes consolidated KPIs", () => {
    const result = computeDashboard(
      accounts,
      movements,
      pendingTransfers,
      "all",
      "30d",
      { bank: "Banco", crypto: "Cripto", betting: "Apostas" },
    );

    expect(result.kpis.operationalEquity).toBe(8000);
    expect(result.kpis.inTransit).toBe(500);
    expect(result.kpis.totalPatrimony).toBe(8500);
    expect(result.kpis.netCapital).toBe(8000);
    expect(result.kpis.accumulatedResult).toBe(500);
    expect(result.kpis.totalFees).toBe(50);
    expect(result.kpis.realizedCashback).toBe(100);
  });

  it("filters KPIs by holder", () => {
    const result = computeDashboard(
      accounts,
      movements,
      pendingTransfers,
      "h2",
      "30d",
      { bank: "Banco", crypto: "Cripto", betting: "Apostas" },
    );

    expect(result.kpis.operationalEquity).toBe(3000);
    expect(result.kpis.inTransit).toBe(0);
    expect(result.kpis.netCapital).toBe(0);
  });

  it("builds equity by holder slices", () => {
    const slices = buildEquityByHolder(accounts);
    expect(slices).toHaveLength(2);
    expect(slices[0].value).toBe(5000);
  });

  it("sums in-transit from pending transfers", () => {
    expect(calculateInTransit(pendingTransfers, "h1")).toBe(500);
    expect(calculateInTransit(pendingTransfers, "h2")).toBe(0);
  });

  it("builds time series with at least one point", () => {
    const series = buildTimeSeries(accounts, movements, "30d");
    expect(series.length).toBeGreaterThan(0);
    expect(series[series.length - 1].patrimony).toBeGreaterThan(0);
  });
});