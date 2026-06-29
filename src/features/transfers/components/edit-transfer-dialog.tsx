"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateTransfer } from "@/features/movements/actions";
import {
  formatNumberDraft,
  isValidDecimalDraft,
  parseDecimalDraft,
} from "@/shared/lib/money/decimal-input";
import {
  formatTransferTitle,
  resolveTransferKind,
  transferKindLabels,
} from "@/shared/lib/domain/transfer-labels";
import type { TransferRecord } from "@/shared/types/database";

interface EditTransferDialogProps {
  transfer: TransferRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface EditTransferDraft {
  status: "pending" | "completed";
  occurredAt: string;
  externalId: string;
  description: string;
  amountDrafts: {
    sent_amount: string;
    expected_received_amount: string;
    received_amount: string;
    fee_amount: string;
  };
}

function buildTransferDraft(transfer: TransferRecord | null): EditTransferDraft {
  if (!transfer) {
    return {
      status: "pending",
      occurredAt: "",
      externalId: "",
      description: "",
      amountDrafts: {
        sent_amount: "",
        expected_received_amount: "",
        received_amount: "",
        fee_amount: "",
      },
    };
  }

  const metadata = transfer.metadata as Record<string, unknown>;
  const expected = metadata.expected_received as number | undefined;
  const fee = metadata.fee_amount as number | undefined;

  return {
    status: transfer.status === "completed" ? "completed" : "pending",
    occurredAt: transfer.occurred_at,
    externalId: transfer.external_id ?? "",
    description: transfer.description ?? "",
    amountDrafts: {
      sent_amount: formatNumberDraft(transfer.amount),
      expected_received_amount: formatNumberDraft(expected),
      received_amount: formatNumberDraft(transfer.credit_movement?.amount),
      fee_amount: formatNumberDraft(fee ?? 0),
    },
  };
}

export function EditTransferDialog({
  transfer,
  open,
  onOpenChange,
  onSuccess,
}: EditTransferDialogProps) {
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, EditTransferDraft>>({});
  const draftKey = transfer?.transfer_group_id ?? "empty";
  const defaultDraft = useMemo(
    () => buildTransferDraft(transfer),
    [transfer],
  );
  const draft = drafts[draftKey] ?? defaultDraft;

  function updateDraft(patch: Partial<EditTransferDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [draftKey]: {
        ...draft,
        ...patch,
      },
    }));
  }

  function handleDraftChange(
    field: keyof EditTransferDraft["amountDrafts"],
    raw: string,
  ) {
    if (!isValidDecimalDraft(raw)) return;
    updateDraft({
      amountDrafts: { ...draft.amountDrafts, [field]: raw },
    });
  }

  async function handleSubmit() {
    if (!transfer?.transfer_group_id) return;

    const sentAmount = parseDecimalDraft(draft.amountDrafts.sent_amount);
    const expectedAmount = parseDecimalDraft(
      draft.amountDrafts.expected_received_amount,
    );
    const receivedAmount = parseDecimalDraft(
      draft.amountDrafts.received_amount,
    );
    const feeAmount = parseDecimalDraft(draft.amountDrafts.fee_amount) ?? 0;

    if (sentAmount === undefined || sentAmount <= 0) {
      toast.error("Informe o valor enviado");
      return;
    }

    if (
      draft.status === "completed" &&
      (receivedAmount === undefined || receivedAmount <= 0)
    ) {
      toast.error("Informe o valor recebido");
      return;
    }

    setLoading(true);
    try {
      await updateTransfer({
        transfer_group_id: transfer.transfer_group_id,
        sent_amount: sentAmount,
        expected_received_amount: expectedAmount,
        received_amount: receivedAmount,
        fee_amount: feeAmount,
        status: draft.status,
        occurred_at: draft.occurredAt,
        external_id: draft.externalId || undefined,
        description: draft.description || undefined,
      });
      toast.success("Transferência atualizada");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  if (!transfer) return null;

  const metadata = transfer.metadata as Record<string, unknown>;
  const kind = resolveTransferKind(metadata);
  const isTrader = kind === "trader";
  const toCurrencyCode = metadata.to_currency_code as string | undefined;
  const title = formatTransferTitle(
    kind,
    metadata,
    transfer.account.name,
    transfer.counter_account?.name ?? transfer.account.name,
    transfer.currency.code,
    toCurrencyCode,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar transferência</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm">
            <p>
              <span className="text-muted-foreground">Tipo: </span>
              {transferKindLabels[kind]}
            </p>
            <p className="font-medium">{title}</p>
          </div>

          <div className="space-y-2">
            <Label>Valor enviado</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={draft.amountDrafts.sent_amount}
              onChange={(e) => handleDraftChange("sent_amount", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>
              {isTrader ? "Quantidade recebida" : "Valor esperado no destino"}
            </Label>
            <Input
              type="text"
              inputMode="decimal"
              value={draft.amountDrafts.expected_received_amount}
              onChange={(e) =>
                handleDraftChange("expected_received_amount", e.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Taxa (opcional)</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={draft.amountDrafts.fee_amount}
              onChange={(e) => handleDraftChange("fee_amount", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={draft.status}
              onValueChange={(v) =>
                v && updateDraft({ status: v as "pending" | "completed" })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente (em trânsito)</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {draft.status === "completed" && (
            <div className="space-y-2">
              <Label>Valor efetivamente recebido</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={draft.amountDrafts.received_amount}
                onChange={(e) =>
                  handleDraftChange("received_amount", e.target.value)
                }
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={draft.occurredAt}
              onChange={(e) => updateDraft({ occurredAt: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>ID da transação (opcional)</Label>
            <Input
              value={draft.externalId}
              onChange={(e) => updateDraft({ externalId: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea
              rows={2}
              value={draft.description}
              onChange={(e) => updateDraft({ description: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" disabled={loading} onClick={handleSubmit}>
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
