import { z } from "zod";
import { holderStatusSchema } from "@/features/holders/schemas";

export const createBankSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(120),
  notes: z.string().max(500).optional(),
  status: holderStatusSchema,
});

export const updateBankSchema = createBankSchema.extend({
  id: z.string().uuid(),
});

export type CreateBankInput = z.infer<typeof createBankSchema>;
export type UpdateBankInput = z.infer<typeof updateBankSchema>;