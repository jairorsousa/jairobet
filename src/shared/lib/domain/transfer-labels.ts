export type TransferKind = "transfer" | "exchange" | "deposit" | "withdrawal";

export const transferKindLabels: Record<TransferKind, string> = {
  transfer: "Transferência",
  exchange: "Câmbio",
  deposit: "Depósito",
  withdrawal: "Saque",
};

export const transferKindOptions: Array<{ value: TransferKind; label: string }> =
  Object.entries(transferKindLabels).map(([value, label]) => ({
    value: value as TransferKind,
    label,
  }));

export function formatTransferDescription(
  kind: TransferKind,
  direction: "debit" | "credit",
  counterName: string,
): string {
  const label = transferKindLabels[kind];
  return direction === "debit"
    ? `${label} → ${counterName}`
    : `${label} ← ${counterName}`;
}

export function resolveTransferKind(
  metadata: Record<string, unknown> | null | undefined,
): TransferKind {
  const kind = metadata?.transfer_kind;
  if (
    kind === "transfer" ||
    kind === "exchange" ||
    kind === "deposit" ||
    kind === "withdrawal"
  ) {
    return kind;
  }
  return "transfer";
}