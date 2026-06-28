import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/shared/lib/money/format";
import type { PendingTransfer } from "@/shared/types/database";

interface DashboardPendingSectionProps {
  transfers: PendingTransfer[];
  holderId: string;
}

export function DashboardPendingSection({
  transfers,
  holderId,
}: DashboardPendingSectionProps) {
  const filtered =
    holderId === "all"
      ? transfers
      : transfers.filter((t) => t.account.holder_id === holderId);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">Pendências</h3>
          <p className="text-sm text-muted-foreground">
            Transferências aguardando confirmação de recebimento
          </p>
        </div>
        {filtered.length > 0 ? (
          <Link href="/transferencias">
            <Button variant="outline" size="sm">
              Ver todas
            </Button>
          </Link>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/50 py-8 text-center text-sm text-muted-foreground">
          Nenhuma transferência pendente.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.slice(0, 5).map((transfer) => (
            <Card key={transfer.id} className="glass-card border-border/50">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-start gap-3">
                  <ArrowLeftRight className="mt-0.5 size-4 text-warning" />
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {transfer.account.name} → {transfer.counter_account?.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {transfer.account.holder.name}
                    </p>
                  </div>
                </div>
                <Badge className="border-0 bg-warning/15 text-warning">
                  Pendente
                </Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="font-medium text-warning">
                  {formatMoney(transfer.amount_brl, "BRL")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(transfer.occurred_at + "T12:00:00").toLocaleDateString(
                    "pt-BR",
                  )}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}