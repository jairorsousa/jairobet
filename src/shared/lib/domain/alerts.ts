import { differenceInDays, parseISO } from "date-fns";
import Decimal from "decimal.js";
import type {
  AccountWithDetails,
  PendingTransfer,
  Reconciliation,
} from "@/shared/types/database";

export const ALERT_THRESHOLDS = {
  pendingTransferDays: 3,
  reconciliationOverdueDays: 7,
  divergenceBrl: 10,
} as const;

export type AlertSeverity = "warning" | "destructive";
export type AlertType =
  | "pending_transfer_stale"
  | "reconciliation_overdue"
  | "negative_balance"
  | "reconciliation_divergence";

export interface AppAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  href?: string;
  account_id?: string;
}

export interface LastReconciliationByKey {
  account_id: string;
  currency_id: string;
  reconciliation: Reconciliation;
}

function reconciliationKey(accountId: string, currencyId: string): string {
  return `${accountId}:${currencyId}`;
}

export function indexLatestReconciliations(
  reconciliations: Reconciliation[],
): Map<string, Reconciliation> {
  const map = new Map<string, Reconciliation>();

  for (const row of reconciliations) {
    const key = reconciliationKey(row.account_id, row.currency_id);
    const existing = map.get(key);
    if (!existing || row.reconciled_at > existing.reconciled_at) {
      map.set(key, row);
    }
  }

  return map;
}

function daysSince(dateStr: string): number {
  return differenceInDays(new Date(), parseISO(dateStr));
}

function differenceBrl(
  difference: number,
  rateBrl: number,
): number {
  return new Decimal(difference).abs().mul(rateBrl).toNumber();
}

export function buildAlerts(input: {
  accounts: AccountWithDetails[];
  pendingTransfers: PendingTransfer[];
  latestReconciliations: Map<string, Reconciliation>;
}): AppAlert[] {
  const alerts: AppAlert[] = [];
  const { accounts, pendingTransfers, latestReconciliations } = input;

  for (const transfer of pendingTransfers) {
    const days = daysSince(transfer.occurred_at);
    if (days > ALERT_THRESHOLDS.pendingTransferDays) {
      alerts.push({
        id: `transfer-${transfer.id}`,
        type: "pending_transfer_stale",
        severity: "warning",
        title: "Transferência pendente há muito tempo",
        description: `${transfer.account.name} → ${transfer.counter_account?.name ?? "?"} — ${days} dias`,
        href: "/transferencias",
      });
    }
  }

  for (const account of accounts) {
    if (account.status === "closed") continue;

    for (const balance of account.balances) {
      const key = reconciliationKey(account.id, balance.currency_id);
      const last = latestReconciliations.get(key);

      if (balance.calculated_balance < 0) {
        alerts.push({
          id: `negative-${account.id}-${balance.currency_id}`,
          type: "negative_balance",
          severity: "destructive",
          title: "Saldo negativo",
          description: `${account.name} (${balance.currency.code}): ${balance.calculated_balance}`,
          href: `/contas/${account.id}`,
          account_id: account.id,
        });
      }

      if (last) {
        const diffBrl = differenceBrl(
          last.difference,
          balance.currency.last_rate_brl,
        );
        if (diffBrl > ALERT_THRESHOLDS.divergenceBrl) {
          alerts.push({
            id: `divergence-${last.id}`,
            type: "reconciliation_divergence",
            severity: "warning",
            title: "Divergência na conciliação",
            description: `${account.name} (${balance.currency.code}): diferença de R$ ${diffBrl.toFixed(2)}`,
            href: "/conciliacao",
            account_id: account.id,
          });
        }

        const days = daysSince(last.reconciled_at);
        if (days > ALERT_THRESHOLDS.reconciliationOverdueDays) {
          alerts.push({
            id: `recon-overdue-${account.id}-${balance.currency_id}`,
            type: "reconciliation_overdue",
            severity: "warning",
            title: "Conciliação desatualizada",
            description: `${account.name} (${balance.currency.code}): há ${days} dias`,
            href: "/conciliacao",
            account_id: account.id,
          });
        }
      } else {
        const days = daysSince(account.created_at.slice(0, 10));
        if (days > ALERT_THRESHOLDS.reconciliationOverdueDays) {
          alerts.push({
            id: `recon-never-${account.id}-${balance.currency_id}`,
            type: "reconciliation_overdue",
            severity: "warning",
            title: "Conta sem conciliação",
            description: `${account.name} (${balance.currency.code}): nunca conciliada`,
            href: "/conciliacao",
            account_id: account.id,
          });
        }
      }
    }
  }

  const severityOrder: Record<AlertSeverity, number> = {
    destructive: 0,
    warning: 1,
  };

  return alerts.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );
}

export function accountsWithAlertIssues(alerts: AppAlert[]): Set<string> {
  const ids = new Set<string>();

  for (const alert of alerts) {
    if (
      alert.account_id &&
      (alert.type === "negative_balance" ||
        alert.type === "reconciliation_divergence" ||
        alert.type === "reconciliation_overdue")
    ) {
      ids.add(alert.account_id);
    }
  }

  return ids;
}