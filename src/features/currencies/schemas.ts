import { z } from "zod";

export const updateCurrencyRateSchema = z.object({
  id: z.string().uuid(),
  last_rate_brl: z.number().positive("Cotação deve ser maior que zero"),
});

export type UpdateCurrencyRateInput = z.infer<typeof updateCurrencyRateSchema>;