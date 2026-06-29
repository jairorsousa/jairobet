"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmTransferReceipt } from "@/features/movements/actions";
import {
  confirmTransferSchema,
  type ConfirmTransferInput,
} from "@/features/movements/schemas";
import {
  formatNumberDraft,
  isValidDecimalDraft,
  parseDecimalDraft,
} from "@/shared/lib/money/decimal-input";
import { formatMoney } from "@/shared/lib/money/format";
import {
  formatTransferTitle,
  resolveTransferKind,
} from "@/shared/lib/domain/transfer-labels";
import type { PendingTransfer } from "@/shared/types/database";

interface ConfirmTransferDialogProps {
  transfer: PendingTransfer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ConfirmTransferDialog({
  transfer,
  open,
  onOpenChange,
  onSuccess,
}: ConfirmTransferDialogProps) {
  const [loading, setLoading] = useState(false);
  const [receivedDrafts, setReceivedDrafts] = useState<Record<string, string>>(
    {},
  );

  const metadata = (transfer?.metadata ?? {}) as Record<string, unknown>;
  const expected = metadata.expected_received as number | undefined;
  const transferDraftKey = transfer?.transfer_group_id ?? "empty";
  const defaultReceivedDraft = transfer
    ? formatNumberDraft(expected ?? transfer.amount)
    : "";
  const receivedDraft =
    receivedDrafts[transferDraftKey] ?? defaultReceivedDraft;

  const form = useForm<ConfirmTransferInput>({
    resolver: zodResolver(confirmTransferSchema),
    values: transfer
      ? {
          transfer_group_id: transfer.transfer_group_id!,
          received_amount: expected ?? transfer.amount,
          occurred_at: new Date().toISOString().slice(0, 10),
        }
      : undefined,
  });

  async function onSubmit(values: ConfirmTransferInput) {
    const receivedAmount = parseDecimalDraft(receivedDraft);
    if (receivedAmount === undefined || receivedAmount <= 0) {
      toast.error("Informe o valor recebido");
      return;
    }

    setLoading(true);
    try {
      await confirmTransferReceipt({
        ...values,
        received_amount: receivedAmount,
      });
      toast.success("Recebimento confirmado");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao confirmar");
    } finally {
      setLoading(false);
    }
  }

  if (!transfer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar recebimento</DialogTitle>
          <DialogDescription>
            {formatTransferTitle(
              resolveTransferKind(metadata),
              metadata,
              transfer.account.name,
              transfer.counter_account?.name ?? transfer.account.name,
              transfer.currency.code,
              metadata.to_currency_code as string | undefined,
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enviado:{" "}
            {formatMoney(
              transfer.amount,
              transfer.currency.code,
              transfer.currency.decimal_places,
            )}
            {expected ? (
              <>
                {" "}
                · Esperado:{" "}
                {formatMoney(
                  expected,
                  transfer.currency.code,
                  transfer.currency.decimal_places,
                )}
              </>
            ) : null}
          </p>
          <div className="space-y-2">
            <Label htmlFor="received_amount">Valor recebido</Label>
            <Input
              id="received_amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00016007"
              value={receivedDraft}
              onChange={(e) => {
                const raw = e.target.value;
                if (!isValidDecimalDraft(raw)) return;
                setReceivedDrafts((prev) => ({
                  ...prev,
                  [transferDraftKey]: raw,
                }));
                const parsed = parseDecimalDraft(raw);
                if (parsed !== undefined) {
                  form.setValue("received_amount", parsed, {
                    shouldValidate: true,
                  });
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="occurred_at">Data do recebimento</Label>
            <Input
              id="occurred_at"
              type="date"
              {...form.register("occurred_at")}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Confirmando…" : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
