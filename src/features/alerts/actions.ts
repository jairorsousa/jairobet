"use server";

import { listAccounts } from "@/features/accounts/actions";
import { listLatestReconciliations } from "@/features/reconciliation/actions";
import { listPendingTransfers } from "@/features/movements/actions";
import {
  buildAlerts,
  indexLatestReconciliations,
  type AppAlert,
} from "@/shared/lib/domain/alerts";

export async function getAlerts(): Promise<AppAlert[]> {
  const [accounts, pendingTransfers, reconciliations] = await Promise.all([
    listAccounts({ status: "all" }),
    listPendingTransfers(),
    listLatestReconciliations(),
  ]);

  return buildAlerts({
    accounts,
    pendingTransfers,
    latestReconciliations: indexLatestReconciliations(reconciliations),
  });
}

export async function getAlertCount(): Promise<number> {
  const alerts = await getAlerts();
  return alerts.length;
}