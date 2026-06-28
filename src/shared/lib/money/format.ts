import Decimal from "decimal.js";

export function formatMoney(
  value: number | string,
  currencyCode: string,
  decimalPlaces = 2,
): string {
  const amount = new Decimal(value);
  const formatted = amount.toFixed(decimalPlaces);

  if (currencyCode === "BRL") {
    return `R$ ${formatted.replace(".", ",")}`;
  }

  return `${formatted} ${currencyCode}`;
}

export function toBrl(
  amount: number | string,
  rateBrl: number | string,
): number {
  return new Decimal(amount).mul(rateBrl).toNumber();
}