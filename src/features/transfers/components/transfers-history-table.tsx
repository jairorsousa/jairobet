"use client";

import { useState } from "react";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmTransferDialog } from "@/features/transfers/components/confirm-transfer-dialog";
import { EditTransferDialog } from "@/features/transfers/components/edit-transfer-dialog";
import { deleteMovement } from "@/features/movements/actions";
import { formatMoney } from "@/shared/lib/money/format";
import {
  formatTransferTitle,
  resolveTransferKind,
  transferKindLabels,
} from "@/shared/lib/domain/transfer-labels";
import type { PendingTransfer, TransferRecord } from "@/shared/types/database";
import { cn } from "@/lib/utils";

interface TransfersHistoryTableProps {
  transfers: TransferRecord[];
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  completed: "Concluída",
  cancelled: "Cancelada",
  failed: "Falhou",
};

function statusBadgeClass(status: string) {
  switch (status) {
    case "pending":
      return "border-0 bg-warning/15 text-warning";
    case "completed":
      return "border-0 bg-success/15 text-success";
    case "cancelled":
      return "border-0 bg-muted text-muted-foreground";
    case "failed":
      return "border-0 bg-destructive/15 text-destructive";
    default:
      return "border-0 bg-muted text-muted-foreground";
  }
}

export function TransfersHistoryTable({
  transfers: initial,
}: TransfersHistoryTableProps) {
  const [transfers, setTransfers] = useState(initial);
  const [confirming, setConfirming] = useState<PendingTransfer | null>(null);
  const [editing, setEditing] = useState<TransferRecord | null>(null);
  const [deleting, setDeleting] = useState<TransferRecord | null>(null);
  const [loading, setLoading] = useState(false);

  function handleRefresh() {
    window.location.reload();
  }

  function handleConfirmSuccess() {
    if (confirming) {
      setTransfers((prev) =>
        prev.map((transfer) =>
          transfer.transfer_group_id === confirming.transfer_group_id
            ? { ...transfer, status: "completed" as const }
            : transfer,
        ),
      );
    }
    handleRefresh();
  }

  async function handleDelete() {
    if (!deleting) return;

    setLoading(true);
    try {
      await deleteMovement(deleting.id);
      toast.success("Transferência excluída");
      setTransfers((prev) =>
        prev.filter((transfer) => transfer.id !== deleting.id),
      );
      setDeleting(null);
      handleRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setLoading(false);
    }
  }

  if (transfers.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/50 py-12 text-center text-muted-foreground">
        Nenhuma transferência encontrada com os filtros selecionados.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <table className="w-full min-w-[1040px] text-sm">
          <thead className="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Operação</th>
              <th className="px-4 py-3 font-medium text-right">Enviado</th>
              <th className="px-4 py-3 font-medium text-right">Recebido</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((transfer) => {
              const metadata = transfer.metadata as Record<string, unknown>;
              const kind = resolveTransferKind(metadata);
              const expected = metadata.expected_received as number | undefined;
              const toCurrencyCode = metadata.to_currency_code as
                | string
                | undefined;
              const title = formatTransferTitle(
                kind,
                metadata,
                transfer.account.name,
                transfer.counter_account?.name ?? transfer.account.name,
                transfer.currency.code,
                toCurrencyCode,
              );
              const receivedAmount = transfer.credit_movement?.amount;
              const receivedCurrencyCode =
                transfer.credit_movement?.currency?.code ??
                (metadata.to_currency_code as string | undefined);
              const receivedDecimalPlaces =
                transfer.credit_movement?.currency?.decimal_places ?? 2;

              return (
                <tr
                  key={transfer.id}
                  className="border-t border-border/50 align-top"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(
                      transfer.occurred_at + "T12:00:00",
                    ).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {transferKindLabels[kind]}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{title}</div>
                    <div className="text-xs text-muted-foreground">
                      {transfer.account.holder.name}
                      {transfer.description ? ` · ${transfer.description}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span className="font-medium text-destructive">
                      −
                      {formatMoney(
                        transfer.amount,
                        transfer.currency.code,
                        transfer.currency.decimal_places,
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {receivedAmount !== undefined && receivedCurrencyCode ? (
                      <span className="font-medium text-success">
                        +
                        {formatMoney(
                          receivedAmount,
                          receivedCurrencyCode,
                          receivedDecimalPlaces,
                        )}
                      </span>
                    ) : expected ? (
                      <span className="text-muted-foreground">
                        ~
                        {formatMoney(
                          expected,
                          toCurrencyCode ?? transfer.currency.code,
                          transfer.currency.decimal_places,
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge className={cn(statusBadgeClass(transfer.status))}>
                      {statusLabels[transfer.status] ?? transfer.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {transfer.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirming(transfer)}
                        >
                          <CheckCircle2 className="size-4" />
                          Confirmar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Editar"
                        onClick={() => setEditing(transfer)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Excluir"
                        onClick={() => setDeleting(transfer)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmTransferDialog
        transfer={confirming}
        open={!!confirming}
        onOpenChange={(open) => !open && setConfirming(null)}
        onSuccess={handleConfirmSuccess}
      />

      <EditTransferDialog
        transfer={editing}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSuccess={handleRefresh}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transferência?</AlertDialogTitle>
            <AlertDialogDescription>
              O débito e o crédito vinculados serão removidos e os saldos das
              contas serão recalculados automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={loading}
              onClick={handleDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}