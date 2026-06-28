import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/shared/lib/money/format";
import type { ReconciliationWithDetails } from "@/shared/types/database";
import { cn } from "@/lib/utils";

interface ReconciliationHistoryProps {
  items: ReconciliationWithDetails[];
}

export function ReconciliationHistory({ items }: ReconciliationHistoryProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/50 py-8 text-center text-sm text-muted-foreground">
        Nenhuma conciliação registrada para esta conta.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.currency.code}</span>
              <Badge variant="outline">
                {new Date(item.reconciled_at + "T12:00:00").toLocaleDateString(
                  "pt-BR",
                )}
              </Badge>
            </div>
            <span
              className={cn(
                "font-medium",
                item.difference > 0 && "text-success",
                item.difference < 0 && "text-destructive",
                item.difference === 0 && "text-muted-foreground",
              )}
            >
              {item.difference === 0
                ? "Sem diferença"
                : `${item.difference > 0 ? "+" : ""}${formatMoney(item.difference, item.currency.code, item.currency.decimal_places)}`}
            </span>
          </div>
          <div className="mt-2 grid gap-1 text-muted-foreground sm:grid-cols-2">
            <p>
              Calculado:{" "}
              {formatMoney(
                item.calculated_balance,
                item.currency.code,
                item.currency.decimal_places,
              )}
            </p>
            <p>
              Informado:{" "}
              {formatMoney(
                item.reported_balance,
                item.currency.code,
                item.currency.decimal_places,
              )}
            </p>
          </div>
          {item.notes ? (
            <p className="mt-2 text-muted-foreground">{item.notes}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}