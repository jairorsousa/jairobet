import { describe, expect, it } from "vitest";
import { buildAlerts, indexLatestReconciliations } from "./alerts";
import type {
  AccountWithDetails,
  PendingTransfer,
  Reconciliation,
} from "@/shared/types/database";

const currency = {
  id: "brl",
  code: "BRL",
  name: "Real",
  symbol: "R$",
  type: "fiat" as const,
  decimal_places: 2,
  last_rate_brl: 1,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

function makeAccount(
  id: string,
  balance: number,
  createdAt = "2026-01-01",
): AccountWithDetails {
  return {
    id,
    operator_id: "op",
    holder_id: "h1",
    name: `Conta ${id}`,
    type: "bank",
    institution: "Test",
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
    created_at: createdAt,
    updated_at: createdAt,
    holder: { id: "h1", name: "Titular", status: "active" },
    default_currency: currency,
    balances: [
      {
        id: `bal-${id}`,
        account_id: id,
        currency_id: "brl",
        initial_balance: balance,
        calculated_balance: balance,
        created_at: createdAt,
        updated_at: createdAt,
        currency,
      },
    ],
  };
}

describe("alerts", () => {
  it("detects negative balance", () => {
    const alerts = buildAlerts({
      accounts: [makeAccount("a1", -50)],
      pendingTransfers: [],
      latestReconciliations: new Map(),
    });

    expect(alerts.some((a) => a.type === "negative_balance")).toBe(true);
  });

  it("detects stale pending transfer", () => {
    const transfer = {
      id: "t1",
      occurred_at: "2026-01-01",
      account: { name: "Origem", holder_id: "h1" },
      counter_account: { name: "Destino" },
    } as unknown as PendingTransfer;

    const alerts = buildAlerts({
      accounts: [],
      pendingTransfers: [transfer],
      latestReconciliations: new Map(),
    });

    expect(alerts.some((a) => a.type === "pending_transfer_stale")).toBe(true);
  });

  it("detects reconciliation divergence above threshold", () => {
    const reconciliation: Reconciliation = {
      id: "r1",
      operator_id: "op",
      account_id: "a1",
      currency_id: "brl",
      reconciled_at: "2026-06-20",
      calculated_balance: 100,
      reported_balance: 120,
      difference: 20,
      notes: null,
      created_at: "2026-06-20",
      updated_at: "2026-06-20",
    };

    const alerts = buildAlerts({
      accounts: [makeAccount("a1", 100)],
      pendingTransfers: [],
      latestReconciliations: indexLatestReconciliations([reconciliation]),
    });

    expect(alerts.some((a) => a.type === "reconciliation_divergence")).toBe(
      true,
    );
  });
});