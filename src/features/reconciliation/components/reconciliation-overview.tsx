"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReconcileDialog } from "@/features/reconciliation/components/reconcile-dialog";
import {
  accountTypeColors,
  accountTypeLabels,
} from "@/shared/constants/labels";
import { ALERT_THRESHOLDS } from "@/shared/lib/domain/alerts";
import { formatMoney } from "@/shared/lib/money/format";
import type { ReconciliationOverviewRow } from "@/shared/types/database";
import { cn } from "@/lib/utils";

interface ReconciliationOverviewProps {
  rows: ReconciliationOverviewRow[];
}

export function ReconciliationOverview({ rows }: ReconciliationOverviewProps) {
  const [selected, setSelected] = useState<ReconciliationOverviewRow | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  function openReconcile(row: ReconciliationOverviewRow) {
    setSelected(row);
    setDialogOpen(true);
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/50 py-12 text-center text-muted-foreground">
        Cadastre contas para começar a conciliar saldos.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {rows.map((row) => {
          const last = row.last_reconciliation;
          const diffBrl = last
            ? Math.abs(last.difference) * row.currency_rate_brl
            : 0;
          const hasDivergence =
            diffBrl > ALERT_THRESHOLDS.divergenceBrl;
          const isOverdue =
            row.days_since_reconciliation !== null &&
            row.days_since_reconciliation >
              ALERT_THRESHOLDS.reconciliationOverdueDays;
          const isNegative = row.calculated_balance < 0;

          return (
            <Card
              key={`${row.account_id}-${row.currency_id}`}
              className={cn(
                "glass-card border-border/50",
                (hasDivergence || isNegative) && "border-destructive/40",
                isOverdue && !hasDivergence && "border-warning/40",
              )}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">
                      <Link
                        href={`/contas/${row.account_id}`}
                        className="hover:text-primary"
                      >
                        {row.account_name}
                      </Link>
                    </CardTitle>
                    <Badge
                      className={cn(
                        "border-0",
                        accountTypeColors[row.account_type],
                      )}
                    >
                      {accountTypeLabels[row.account_type]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {row.holder_name} · {row.currency_code}
                  </p>
                </div>
                {(hasDivergence || isOverdue || isNegative) && (
                  <AlertTriangle
                    className={cn(
                      "size-5 shrink-0",
                      isNegative || hasDivergence
                        ? "text-destructive"
                        : "text-warning",
                    )}
                  />
                )}
              </CardHeader>
              <CardContent className="flex flex-wrap items-end justify-between gap-4">
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">Calculado</p>
                    <p
                      className={cn(
                        "font-medium",
                        isNegative && "text-destructive",
                      )}
                    >
                      {formatMoney(
                        row.calculated_balance,
                        row.currency_code,
                        row.currency_decimal_places,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Última conferência</p>
                    <p className="font-medium">
                      {last
                        ? formatMoney(
                            last.reported_balance,
                            row.currency_code,
                            row.currency_decimal_places,
                          )
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {last
                        ? new Date(
                            last.reconciled_at + "T12:00:00",
                          ).toLocaleDateString("pt-BR")
                        : "Nunca conciliada"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Diferença</p>
                    <p
                      className={cn(
                        "font-medium",
                        last &&
                          last.difference > 0 &&
                          "text-success",
                        last &&
                          last.difference < 0 &&
                          "text-destructive",
                      )}
                    >
                      {last
                        ? `${last.difference > 0 ? "+" : ""}${formatMoney(last.difference, row.currency_code, row.currency_decimal_places)}`
                        : "—"}
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => openReconcile(row)}>
                  <Scale className="size-4" />
                  Conciliar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ReconcileDialog
        row={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}