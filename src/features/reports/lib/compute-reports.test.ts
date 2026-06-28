import { describe, expect, it } from "vitest";
import {
  buildAccountReportRows,
  buildResultReport,
  type ReportMovementRow,
} from "./compute-reports";
import type { AccountWithDetails } from "@/shared/types/database";

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

function makeAccount(id: string, type: "bank" | "betting", balance: number) {
  return {
    id,
    operator_id: "op",
    holder_id: "h1",
    name: `Conta ${id}`,
    type,
    institution: "Test",
    default_currency_id: "brl",
    initial_balance_date: "2026-01-01",
    status: "active" as const,
    masked_identifier: null,
    operational_limit: null,
    notes: null,
    preferred_network: null,
    deposit_methods: null,
    withdrawal_methods: null,
    pending_balance: 0,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    holder: { id: "h1", name: "Titular", status: "active" as const },
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
  } as AccountWithDetails;
}

describe("compute-reports", () => {
  const period = { from: "2026-06-01", to: "2026-06-30" };
  const accounts = [makeAccount("a1", "bank", 1000), makeAccount("b1", "betting", 500)];

  const movements: ReportMovementRow[] = [
    {
      type: "capital_deposit",
      account_id: "a1",
      currency_id: "brl",
      amount: 500,
      amount_brl: 500,
      direction: "credit",
      status: "completed",
      occurred_at: "2026-06-10",
    },
    {
      type: "fee",
      account_id: "b1",
      currency_id: "brl",
      amount: 25,
      amount_brl: 25,
      direction: "debit",
      status: "completed",
      occurred_at: "2026-06-15",
    },
  ];

  it("builds consolidated result report for period", () => {
    const report = buildResultReport(accounts, movements, period);
    expect(report.deposits).toBe(500);
    expect(report.fees).toBe(25);
    expect(report.endPatrimony).toBe(1975);
  });

  it("builds betting account rows only", () => {
    const rows = buildAccountReportRows(accounts, movements, period, "betting");
    expect(rows).toHaveLength(1);
    expect(rows[0].accountId).toBe("b1");
    expect(rows[0].fees).toBe(25);
  });
});