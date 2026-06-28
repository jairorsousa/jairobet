import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  Scale,
  TrendingDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppAlert } from "@/shared/lib/domain/alerts";
import { cn } from "@/lib/utils";

const typeIcons = {
  pending_transfer_stale: ArrowLeftRight,
  reconciliation_overdue: Scale,
  negative_balance: TrendingDown,
  reconciliation_divergence: AlertTriangle,
} as const;

interface AlertsListProps {
  alerts: AppAlert[];
}

export function AlertsList({ alerts }: AlertsListProps) {
  if (alerts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/50 py-12 text-center text-muted-foreground">
        Nenhum alerta no momento. Tudo em ordem.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const Icon = typeIcons[alert.type];
        const content = (
          <Card
            className={cn(
              "glass-card border-border/50 transition-colors",
              alert.href && "hover:border-primary/30",
            )}
          >
            <CardHeader className="flex flex-row items-start gap-3 pb-2">
              <Icon
                className={cn(
                  "mt-0.5 size-5 shrink-0",
                  alert.severity === "destructive"
                    ? "text-destructive"
                    : "text-warning",
                )}
              />
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{alert.title}</CardTitle>
                  <Badge
                    className={cn(
                      "border-0",
                      alert.severity === "destructive"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-warning/15 text-warning",
                    )}
                  >
                    {alert.severity === "destructive" ? "Crítico" : "Atenção"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {alert.description}
                </p>
              </div>
            </CardHeader>
            {alert.href ? (
              <CardContent className="pt-0">
                <p className="text-xs text-primary">Ver detalhes →</p>
              </CardContent>
            ) : null}
          </Card>
        );

        return alert.href ? (
          <Link key={alert.id} href={alert.href}>
            {content}
          </Link>
        ) : (
          <div key={alert.id}>{content}</div>
        );
      })}
    </div>
  );
}