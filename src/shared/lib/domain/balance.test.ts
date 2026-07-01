import { describe, expect, it } from "vitest";
import { accountHasBalance, computeBalanceFromMovements } from "./balance";

describe("balance calculations", () => {
  it("subtracts pending transfer debits from the origin balance", () => {
    const balance = computeBalanceFromMovements(1000, [
      { amount: 250, direction: "debit", status: "pending" },
    ]);

    expect(balance).toBe(750);
  });

  it("ignores pending credits until they are completed", () => {
    const balance = computeBalanceFromMovements(1000, [
      { amount: 250, direction: "credit", status: "pending" },
    ]);

    expect(balance).toBe(1000);
  });

  it("applies completed credits and debits together", () => {
    const balance = computeBalanceFromMovements(1000, [
      { amount: 300, direction: "credit", status: "completed" },
      { amount: 125, direction: "debit", status: "completed" },
    ]);

    expect(balance).toBe(1175);
  });

  it("detects accounts that should appear in balance-only lists", () => {
    expect(
      accountHasBalance({
        balances: [{ calculated_balance: 0 }],
        pending_balance: 0,
      }),
    ).toBe(false);
    expect(
      accountHasBalance({
        balances: [{ calculated_balance: -10 }],
        pending_balance: 0,
      }),
    ).toBe(true);
    expect(
      accountHasBalance({
        balances: [{ calculated_balance: 0 }],
        pending_balance: 25,
      }),
    ).toBe(true);
  });
});
