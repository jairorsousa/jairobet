import type { AccountStatus, AccountType, HolderStatus } from "@/shared/types/database";

export const accountTypeLabels: Record<AccountType, string> = {
  bank: "Banco",
  crypto: "Corretora / Cripto",
  betting: "Casa de apostas",
};

export const accountStatusLabels: Record<AccountStatus, string> = {
  active: "Ativa",
  inactive: "Inativa",
  blocked: "Bloqueada",
  closed: "Encerrada",
};

export const holderStatusLabels: Record<HolderStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

export const accountTypeColors: Record<AccountType, string> = {
  bank: "bg-accent/15 text-accent",
  crypto: "bg-warning/15 text-warning",
  betting: "bg-primary/15 text-primary",
};

export const accountStatusColors: Record<AccountStatus, string> = {
  active: "bg-success/15 text-success",
  inactive: "bg-muted text-muted-foreground",
  blocked: "bg-destructive/15 text-destructive",
  closed: "bg-muted text-muted-foreground",
};