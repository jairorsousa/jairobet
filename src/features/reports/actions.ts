"use server";

import { listAccounts } from "@/features/accounts/actions";
import { createClient } from "@/shared/lib/supabase/server";
import {
  buildAccountReportRows,
  buildHolderReportRows,
  buildResultReport,
  defaultReportPeriod,
  type AccountReportRow,
  type HolderReportRow,
  type ReportMovementRow,
  type ReportPeriod,
  type ResultReport,
} from "./lib/compute-reports";

export type ReportTab = "resultado" | "betting" | "conta" | "titular";

export interface ReportsData {
  period: ReportPeriod;
  tab: ReportTab;
  result: ResultReport;
  bettingRows: AccountReportRow[];
  accountRows: AccountReportRow[];
  holderRows: HolderReportRow[];
}

async function fetchAllMovements(): Promise<ReportMovementRow[]> {
  const supabase = await createClient();
  const pageSize = 1000;
  const all: ReportMovementRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("movements")
      .select(
        "type, account_id, currency_id, amount, amount_brl, direction, status, occurred_at",
      )
      .order("occurred_at", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;

    all.push(...(data as ReportMovementRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

function parsePeriod(from?: string, to?: string): ReportPeriod {
  if (from && to) return { from, to };
  return defaultReportPeriod();
}

export async function getReportsData(
  from?: string,
  to?: string,
  tab: ReportTab = "resultado",
): Promise<ReportsData> {
  const period = parsePeriod(from, to);
  const [accounts, movements] = await Promise.all([
    listAccounts({ status: "all" }),
    fetchAllMovements(),
  ]);

  return {
    period,
    tab,
    result: buildResultReport(accounts, movements, period),
    bettingRows: buildAccountReportRows(
      accounts,
      movements,
      period,
      "betting",
    ),
    accountRows: buildAccountReportRows(accounts, movements, period),
    holderRows: buildHolderReportRows(accounts, movements, period),
  };
}

