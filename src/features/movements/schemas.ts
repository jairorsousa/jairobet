import { z } from "zod";

export const movementStatusSchema = z.enum([
  "pending",
  "completed",
  "cancelled",
  "failed",
]);

export const capitalMovementSchema = z.object({
  account_id: z.string().uuid("Selecione uma conta"),
  currency_id: z.string().uuid("Selecione a moeda"),
  amount: z.number().positive("Valor deve ser maior que zero"),
  occurred_at: z.string().min(1),
  description: z.string().max(500).optional(),
});

export const createCapitalDepositSchema = capitalMovementSchema;
export const createCapitalWithdrawalSchema = capitalMovementSchema;

export const updateCapitalMovementSchema = capitalMovementSchema.extend({
  id: z.string().uuid(),
});

export const createTransferSchema = z
  .object({
    from_account_id: z.string().uuid(),
    from_currency_id: z.string().uuid(),
    to_account_id: z.string().uuid(),
    to_currency_id: z.string().uuid(),
    sent_amount: z.number().positive(),
    expected_received_amount: z.number().positive().optional(),
    received_amount: z.number().positive().optional(),
    fee_amount: z.number().min(0).optional(),
    status: movementStatusSchema,
    occurred_at: z.string().min(1),
    method: z.string().max(80).optional(),
    external_id: z.string().max(120).optional(),
    description: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.from_account_id === data.to_account_id) {
      ctx.addIssue({
        code: "custom",
        message: "Origem e destino devem ser diferentes",
        path: ["to_account_id"],
      });
    }
    if (data.status === "completed" && !data.received_amount) {
      ctx.addIssue({
        code: "custom",
        message: "Informe o valor recebido para transferência concluída",
        path: ["received_amount"],
      });
    }
  });

export const confirmTransferSchema = z.object({
  transfer_group_id: z.string().uuid(),
  received_amount: z.number().positive(),
  occurred_at: z.string().min(1).optional(),
});

export type CreateCapitalDepositInput = z.infer<typeof createCapitalDepositSchema>;
export type CreateCapitalWithdrawalInput = z.infer<
  typeof createCapitalWithdrawalSchema
>;
export type UpdateCapitalMovementInput = z.infer<
  typeof updateCapitalMovementSchema
>;
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type ConfirmTransferInput = z.infer<typeof confirmTransferSchema>;