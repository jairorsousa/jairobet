export type TransferKind = "transfer" | "trader" | "deposit" | "withdrawal";

export const transferKindLabels: Record<TransferKind, string> = {
  transfer: "Transferência",
  trader: "Trader",
  deposit: "Depósito",
  withdrawal: "Saque",
};

export const transferKindOptions: Array<{ value: TransferKind; label: string }> =
  Object.entries(transferKindLabels).map(([value, label]) => ({
    value: value as TransferKind,
    label,
  }));

export function isIntraAccountTrader(
  kind: TransferKind,
  fromAccountId: string,
  toAccountId: string,
): boolean {
  return kind === "trader" && fromAccountId === toAccountId;
}

export function buildTransferDescription(
  kind: TransferKind,
  direction: "debit" | "credit",
  options: {
    counterAccountName: string;
    fromCurrencyCode?: string;
    toCurrencyCode?: string;
    intraAccount?: boolean;
  },
): string {
  if (
    kind === "trader" &&
    options.intraAccount &&
    options.fromCurrencyCode &&
    options.toCurrencyCode
  ) {
    return `Trader · ${options.fromCurrencyCode} → ${options.toCurrencyCode}`;
  }

  const label = transferKindLabels[kind];
  return direction === "debit"
    ? `${label} → ${options.counterAccountName}`
    : `${label} ← ${options.counterAccountName}`;
}

export function formatTransferTitle(
  kind: TransferKind,
  metadata: Record<string, unknown>,
  fromAccountName: string,
  toAccountName: string,
  fromCurrencyCode?: string,
  toCurrencyCode?: string,
): string {
  const intra =
    metadata.intra_account === true ||
    (kind === "trader" && fromAccountName === toAccountName);

  if (intra && fromCurrencyCode && toCurrencyCode) {
    return `Trader · ${fromAccountName}: ${fromCurrencyCode} → ${toCurrencyCode}`;
  }

  return `${transferKindLabels[kind]} · ${fromAccountName} → ${toAccountName}`;
}

export function resolveTransferKind(
  metadata: Record<string, unknown> | null | undefined,
): TransferKind {
  const kind = metadata?.transfer_kind;
  if (kind === "exchange") return "trader";
  if (
    kind === "transfer" ||
    kind === "trader" ||
    kind === "deposit" ||
    kind === "withdrawal"
  ) {
    return kind;
  }
  return "transfer";
}