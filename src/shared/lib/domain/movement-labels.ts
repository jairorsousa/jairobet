import type { MovementType } from "@/shared/types/database";

export const movementTypeLabels: Record<MovementType, string> = {
  capital_deposit: "Aporte",
  capital_withdrawal: "Retirada",
  transfer: "Transferência",
  conversion: "Conversão",
  cashback: "Cashback",
  bonus: "Bônus",
  fee: "Taxa",
  balance_adjustment: "Ajuste de saldo",
};

export const movementStatusLabels: Record<string, string> = {
  pending: "Pendente",
  completed: "Concluída",
  cancelled: "Cancelada",
  failed: "Falhou",
};