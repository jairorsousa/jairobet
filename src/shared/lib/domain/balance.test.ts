import { describe, expect, it } from "vitest";
import { computeBalanceFromMovements } from "./balance";

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
});
