import { type NextRequest } from "next/server";
import { getReportsData } from "@/features/reports/actions";
import { accountTypeLabels } from "@/shared/constants/labels";
import { csvResponse } from "@/shared/lib/export/csv";
import { createClient } from "@/shared/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Não autorizado", { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;
  const scope = params.get("scope") ?? "conta";

  const data = await getReportsData(from, to);

  if (scope === "titular") {
    const rows = data.holderRows.map((row) => [
      row.holderName,
      row.accountCount,
      row.endPatrimony,
      row.deposits,
      row.withdrawals,
      row.netCapitalInPeriod,
      row.result,
      data.period.from,
      data.period.to,
    ]);

    return csvResponse("resultado-por-titular.csv", [
      "Titular",
      "Contas",
      "Patrimônio BRL",
      "Aportes",
      "Retiradas",
      "Capital líquido período",
      "Resultado período",
      "Período início",
      "Período fim",
    ], rows);
  }

  if (scope === "betting") {
    const rows = data.bettingRows.map((row) => [
      row.accountName,
      row.holderName,
      row.startBalanceBrl,
      row.endBalanceBrl,
      row.deposits,
      row.withdrawals,
      row.cashback,
      row.rakeback,
      row.bonuses,
      row.fees,
      row.result,
      data.period.from,
      data.period.to,
    ]);

    return csvResponse("resultado-casas-apostas.csv", [
      "Casa de apostas",
      "Titular",
      "Saldo início BRL",
      "Saldo fim BRL",
      "Aportes",
      "Retiradas",
      "Cashback",
      "Rakeback",
      "Bônus",
      "Taxas",
      "Resultado",
      "Período início",
      "Período fim",
    ], rows);
  }

  if (scope === "resumo") {
    const r = data.result;
    return csvResponse("resultado-consolidado.csv", [
      "Métrica",
      "Valor",
      "Período início",
      "Período fim",
    ], [
      ["Patrimônio início", r.startPatrimony, r.period.from, r.period.to],
      ["Patrimônio fim", r.endPatrimony, r.period.from, r.period.to],
      ["Aportes", r.deposits, r.period.from, r.period.to],
      ["Retiradas", r.withdrawals, r.period.from, r.period.to],
      ["Capital líquido período", r.netCapitalInPeriod, r.period.from, r.period.to],
      ["Resultado período", r.periodResult, r.period.from, r.period.to],
      ["Resultado acumulado", r.accumulatedResult, r.period.from, r.period.to],
      ["ROI %", r.roi ?? "", r.period.from, r.period.to],
      ["Taxas", r.fees, r.period.from, r.period.to],
      ["Cashback", r.cashback, r.period.from, r.period.to],
      ["Rakeback", r.rakeback, r.period.from, r.period.to],
      ["Bônus", r.bonuses, r.period.from, r.period.to],
    ]);
  }

  const rows = data.accountRows.map((row) => [
    row.accountName,
    accountTypeLabels[row.accountType],
    row.holderName,
    row.startBalanceBrl,
    row.endBalanceBrl,
    row.deposits,
    row.withdrawals,
    row.cashback,
    row.rakeback,
    row.bonuses,
    row.fees,
    row.result,
    data.period.from,
    data.period.to,
  ]);

  return csvResponse("resultado-por-conta.csv", [
    "Conta",
    "Tipo",
    "Titular",
    "Saldo início BRL",
    "Saldo fim BRL",
    "Aportes",
    "Retiradas",
    "Cashback",
    "Rakeback",
    "Bônus",
    "Taxas",
    "Resultado",
    "Período início",
    "Período fim",
  ], rows);
}