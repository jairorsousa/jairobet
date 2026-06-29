import { describe, expect, it } from "vitest";
import { createTransferSchema } from "./schemas";

const fromAccountId = "11111111-1111-4111-8111-111111111111";
const toAccountId = "22222222-2222-4222-8222-222222222222";
const brlId = "33333333-3333-4333-8333-333333333333";
const usdtId = "44444444-4444-4444-8444-444444444444";

const baseTransfer = {
  kind: "transfer" as const,
  from_account_id: fromAccountId,
  from_currency_id: brlId,
  to_account_id: toAccountId,
  to_currency_id: brlId,
  sent_amount: 100,
  status: "pending" as const,
  occurred_at: "2026-06-29",
};

describe("transfer schemas", () => {
  it("requires received amount when transfer is completed", () => {
    const result = createTransferSchema.safeParse({
      ...baseTransfer,
      status: "completed",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["received_amount"]);
  });

  it("allows same-account trader movements when currencies are different", () => {
    const result = createTransferSchema.safeParse({
      ...baseTransfer,
      kind: "trader",
      to_account_id: fromAccountId,
      to_currency_id: usdtId,
      status: "completed",
      received_amount: 18,
    });

    expect(result.success).toBe(true);
  });

  it("rejects same-account transfers outside trader movements", () => {
    const result = createTransferSchema.safeParse({
      ...baseTransfer,
      to_account_id: fromAccountId,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["to_account_id"]);
  });
});
