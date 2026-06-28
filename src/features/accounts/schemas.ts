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

const accountBaseSchema = z.object({
  holder_id: z.string().uuid("Selecione um titular"),
  name: z.string().min(1, "Nome é obrigatório").max(120),
  type: accountTypeSchema,
  institution: z.string().max(120).optional(),
  bank_id: z.string().uuid().optional(),
  crypto_broker_id: z.string().uuid().optional(),
  betting_house_id: z.string().uuid().optional(),
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

type InstitutionValidationInput = Pick<
  z.infer<typeof accountBaseSchema>,
  "type" | "bank_id" | "crypto_broker_id" | "betting_house_id" | "institution"
>;

function validateInstitution(
  data: InstitutionValidationInput,
  ctx: z.RefinementCtx,
) {
  if (data.type === "bank" && !data.bank_id) {
    ctx.addIssue({
      code: "custom",
      message: "Selecione um banco",
      path: ["bank_id"],
    });
  }
  if (data.type === "crypto" && !data.crypto_broker_id) {
    ctx.addIssue({
      code: "custom",
      message: "Selecione uma corretora / carteira",
      path: ["crypto_broker_id"],
    });
  }
  if (data.type === "betting" && !data.betting_house_id) {
    ctx.addIssue({
      code: "custom",
      message: "Selecione uma casa de apostas",
      path: ["betting_house_id"],
    });
  }
}

export const createAccountSchema = accountBaseSchema.superRefine(
  validateInstitution,
);

export const updateAccountSchema = accountBaseSchema
  .omit({ currency_balances: true })
  .extend({
    id: z.string().uuid(),
    currency_balances: z.array(currencyBalanceSchema).optional(),
  })
  .superRefine(validateInstitution);

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;