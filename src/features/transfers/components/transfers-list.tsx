"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmTransferDialog } from "@/features/transfers/components/confirm-transfer-dialog";
import { formatMoney } from "@/shared/lib/money/format";
import {
  resolveTransferKind,
  transferKindLabels,
} from "@/shared/lib/domain/transfer-labels";
import type { PendingTransfer } from "@/shared/types/database";

interface TransfersListProps {
  transfers: PendingTransfer[];
}

export function TransfersList({ transfers: initial }: TransfersListProps) {
  const [transfers, setTransfers] = useState(initial);
  const [confirming, setConfirming] = useState<PendingTransfer | null>(null);

  function handleSuccess() {
    if (confirming) {
      setTransfers((prev) =>
        prev.filter((t) => t.transfer_group_id !== confirming.transfer_group_id),
      );
    }
    window.location.reload();
  }

  if (transfers.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/50 py-12 text-center text-muted-foreground">
        Nenhuma transferência pendente.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {transfers.map((transfer) => {
          const metadata = transfer.metadata as Record<string, unknown>;
          const expected = metadata.expected_received as number | undefined;
          const kind = resolveTransferKind(metadata);

          return (
            <Card key={transfer.id} className="glass-card border-border/50">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-base">
                    {transferKindLabels[kind]} · {transfer.account.name} →{" "}
                    {transfer.counter_account?.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {transfer.account.holder.name}
                    {transfer.description ? ` · ${transfer.description}` : ""}
                  </p>
                </div>
                <Badge className="border-0 bg-warning/15 text-warning">
                  Pendente
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm">
                  <p>
                    Enviado:{" "}
                    <span className="font-medium text-destructive">
                      −
                      {formatMoney(
                        transfer.amount,
                        transfer.currency.code,
                        transfer.currency.decimal_places,
                      )}
                    </span>
                  </p>
                  {expected ? (
                    <p className="text-muted-foreground">
                      Esperado no destino:{" "}
                      {formatMoney(
                        expected,
                        transfer.currency.code,
                        transfer.currency.decimal_places,
                      )}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {new Date(transfer.occurred_at + "T12:00:00").toLocaleDateString(
                      "pt-BR",
                    )}
                  </p>
                </div>
                <Button size="sm" onClick={() => setConfirming(transfer)}>
                  <CheckCircle2 className="size-4" />
                  Confirmar recebimento
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ConfirmTransferDialog
        transfer={confirming}
        open={!!confirming}
        onOpenChange={(open) => !open && setConfirming(null)}
        onSuccess={handleSuccess}
      />
    </>
  );
}