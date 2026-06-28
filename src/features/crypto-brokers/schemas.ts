import { z } from "zod";
import { holderStatusSchema } from "@/features/holders/schemas";

export const createCryptoBrokerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(120),
  notes: z.string().max(500).optional(),
  status: holderStatusSchema,
});

export const updateCryptoBrokerSchema = createCryptoBrokerSchema.extend({
  id: z.string().uuid(),
});

export type CreateCryptoBrokerInput = z.infer<typeof createCryptoBrokerSchema>;
export type UpdateCryptoBrokerInput = z.infer<typeof updateCryptoBrokerSchema>;