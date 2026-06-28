export function isValidDecimalDraft(value: string): boolean {
  if (value === "") return true;
  return /^\d*[,.]?\d*$/.test(value);
}

export function parseDecimalDraft(value: string): number | undefined {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "" || normalized === ".") return undefined;
  const num = Number(normalized);
  return Number.isFinite(num) ? num : undefined;
}

export function formatNumberDraft(value: number | undefined): string {
  if (value === undefined) return "";
  return String(value);
}