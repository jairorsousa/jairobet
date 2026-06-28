import { z } from "zod";
import { holderStatusSchema } from "@/features/holders/schemas";

export const createBettingHouseSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(120),
  notes: z.string().max(500).optional(),
  status: holderStatusSchema,
});

export const updateBettingHouseSchema = createBettingHouseSchema.extend({
  id: z.string().uuid(),
});

export type CreateBettingHouseInput = z.infer<typeof createBettingHouseSchema>;
export type UpdateBettingHouseInput = z.infer<typeof updateBettingHouseSchema>;