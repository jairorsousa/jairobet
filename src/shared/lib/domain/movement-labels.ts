import type { MovementType } from "@/shared/types/database";

export const movementTypeLabels: Record<MovementType, string> = {
  capital_deposit: "Aporte",
  capital_withdrawal: "Retirada",
  transfer: "Transferência",
  conversion: "Conversão",
  cashback: "Cashback",
  rakeback: "Rakeback",
  bet_won: "Aposta ganha",
  bet_lost: "Aposta perdida",
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

export const movementTypeColors: Record<
  MovementType,
  { bg: string; text: string }
> = {
  capital_deposit: { bg: "bg-success/15", text: "text-success" },
  capital_withdrawal: { bg: "bg-destructive/15", text: "text-destructive" },
  transfer: { bg: "bg-accent/15", text: "text-accent" },
  conversion: { bg: "bg-accent/15", text: "text-accent" },
  cashback: { bg: "bg-primary/15", text: "text-primary" },
  rakeback: { bg: "bg-warning/15", text: "text-warning" },
  bet_won: { bg: "bg-success/15", text: "text-success" },
  bet_lost: { bg: "bg-destructive/15", text: "text-destructive" },
  bonus: { bg: "bg-primary/15", text: "text-primary" },
  fee: { bg: "bg-destructive/15", text: "text-destructive" },
  balance_adjustment: { bg: "bg-muted", text: "text-muted-foreground" },
};

export const newMovementOptions: Array<{
  value: MovementType | "capital_deposit" | "capital_withdrawal";
  label: string;
}> = [
  { value: "capital_deposit", label: "Aporte" },
  { value: "capital_withdrawal", label: "Retirada" },
  { value: "fee", label: "Taxa" },
  { value: "cashback", label: "Cashback" },
  { value: "rakeback", label: "Rakeback" },
  { value: "bet_won", label: "Aposta ganha" },
  { value: "bet_lost", label: "Aposta perdida" },
  { value: "bonus", label: "Bônus" },
  { value: "conversion", label: "Conversão" },
  { value: "balance_adjustment", label: "Ajuste de saldo" },
];