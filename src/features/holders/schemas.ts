import { z } from "zod";

export const holderStatusSchema = z.enum(["active", "inactive"]);

export const createHolderSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(120),
  notes: z.string().max(500).optional(),
  status: holderStatusSchema,
});

export const updateHolderSchema = createHolderSchema.extend({
  id: z.string().uuid(),
});

export type CreateHolderInput = z.infer<typeof createHolderSchema>;
export type UpdateHolderInput = z.infer<typeof updateHolderSchema>;