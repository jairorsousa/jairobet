import { z } from "zod";

export const createReconciliationSchema = z.object({
  account_id: z.string().uuid(),
  currency_id: z.string().uuid(),
  reported_balance: z.number(),
  reconciled_at: z.string().min(1),
  notes: z.string().max(500).optional(),
  create_adjustment: z.boolean().optional(),
});

export type CreateReconciliationInput = z.infer<typeof createReconciliationSchema>;