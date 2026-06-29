"use server";

import { getAlerts } from "@/features/alerts/actions";
import { listAccounts } from "@/features/accounts/actions";
import { listHolders } from "@/features/holders/actions";
import { listPendingTransfers } from "@/features/movements/actions";
import { accountsWithAlertIssues } from "@/shared/lib/domain/alerts";
import { accountTypeLabels } from "@/shared/constants/labels";
import { createClient } from "@/shared/lib/supabase/server";
import type { AccountWithDetails, PendingTransfer } from "@/shared/types/database";
import {
  computeDashboard,
  type DashboardComputed,
  type DashboardMovementRow,
  type DashboardPeriod,
} from "./lib/compute-dashboard";

export interface DashboardData extends DashboardComputed {
  holders: Awaited<ReturnType<typeof listHolders>>;
  accounts: AccountWithDetails[];
  pendingTransfers: PendingTransfer[];
  flaggedAccountIds: string[];
  holderId: string;
  period: DashboardPeriod;
}

async function fetchAllMovements(): Promise<DashboardMovementRow[]> {
  const supabase = await createClient();
  const pageSize = 1000;
  const all: DashboardMovementRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("movements")
      .select(
        "type, account_id, currency_id, amount, amount_brl, direction, status, occurred_at, metadata",
      )
      .order("occurred_at", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;

    all.push(...(data as DashboardMovementRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

export async function getDashboardData(
  holderId = "all",
  period: DashboardPeriod = "30d",
): Promise<DashboardData> {
  const [holders, accounts, pendingTransfers, movements, alerts] =
    await Promise.all([
      listHolders(),
      listAccounts({ status: "all" }),
      listPendingTransfers(),
      fetchAllMovements(),
      getAlerts(),
    ]);

  const computed = computeDashboard(
    accounts,
    movements,
    pendingTransfers,
    holderId,
    period,
    accountTypeLabels,
  );

  return {
    ...computed,
    holders,
    accounts,
    pendingTransfers,
    flaggedAccountIds: [...accountsWithAlertIssues(alerts)],
    holderId,
    period,
  };
}