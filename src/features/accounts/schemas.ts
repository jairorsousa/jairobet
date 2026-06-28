import { z } from "zod";

export const accountTypeSchema = z.enum(["bank", "crypto", "betting"]);
export const accountStatusSchema = z.enum([
  "active",
  "inactive",
  "blocked",
  "closed",
]);

const currencyBalanceSchema = z.object({
  currency_id: z.string().uuid(),
  initial_balance: z.number().min(0, "Saldo não pode ser negativo"),
});

export const createAccountSchema = z.object({
  holder_id: z.string().uuid("Selecione um titular"),
  name: z.string().min(1, "Nome é obrigatório").max(120),
  type: accountTypeSchema,
  institution: z.string().min(1, "Instituição é obrigatória").max(120),
  default_currency_id: z.string().uuid(),
  initial_balance_date: z.string().min(1),
  status: accountStatusSchema,
  masked_identifier: z.string().max(80).optional(),
  operational_limit: z.number().min(0).optional().nullable(),
  notes: z.string().max(500).optional(),
  preferred_network: z.string().max(80).optional(),
  deposit_methods: z.string().max(200).optional(),
  withdrawal_methods: z.string().max(200).optional(),
  pending_balance: z.number().min(0),
  currency_balances: z.array(currencyBalanceSchema).min(1),
});

export const updateAccountSchema = createAccountSchema
  .omit({ currency_balances: true })
  .extend({
    id: z.string().uuid(),
    currency_balances: z.array(currencyBalanceSchema).optional(),
  });

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;