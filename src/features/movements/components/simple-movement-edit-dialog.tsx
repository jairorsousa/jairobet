"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { updateSimpleMovement } from "@/features/movements/actions";
import {
  mapBonusToMovementStatus,
  mapCashbackToMovementStatus,
  mapRakebackToMovementStatus,
  updateSimpleMovementSchema,
  type UpdateSimpleMovementInput,
} from "@/features/movements/schemas";
import type {
  AccountWithDetails,
  MovementWithDetails,
} from "@/shared/types/database";

interface SimpleMovementEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: MovementWithDetails;
  accounts: AccountWithDetails[];
  onSuccess?: () => void;
}

export function SimpleMovementEditDialog({
  open,
  onOpenChange,
  movement,
  accounts,
  onSuccess,
}: SimpleMovementEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const metadata = movement.metadata as Record<string, unknown>;

  const form = useForm<UpdateSimpleMovementInput>({
    resolver: zodResolver(updateSimpleMovementSchema),
    defaultValues: {
      id: movement.id,
      account_id: movement.account_id,
      currency_id: movement.currency_id,
      amount: movement.amount,
      occurred_at: movement.occurred_at,
      description: movement.description ?? "",
      status: movement.status,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        id: movement.id,
        account_id: movement.account_id,
        currency_id: movement.currency_id,
        amount: movement.amount,
        occurred_at: movement.occurred_at,
        description: movement.description ?? "",
        status: movement.status,
        metadata: movement.metadata,
      });
    }
  }, [open, movement, form]);

  const selectedAccountId = useWatch({
    control: form.control,
    name: "account_id",
  });
  const selectedCurrencyId = useWatch({
    control: form.control,
    name: "currency_id",
  });
  const formMetadata = useWatch({
    control: form.control,
    name: "metadata",
  }) as Record<string, unknown> | undefined;
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  async function onSubmit(values: UpdateSimpleMovementInput) {
    setLoading(true);
    try {
      const meta = (values.metadata ?? movement.metadata) as Record<
        string,
        unknown
      >;
      let status = values.status;

      if (movement.type === "cashback" && meta.cashback_status) {
        status = mapCashbackToMovementStatus(
          meta.cashback_status as
            | "previsto"
            | "pendente"
            | "recebido"
            | "cancelado"
            | "expirado",
        );
      }
      if (movement.type === "rakeback" && meta.rakeback_status) {
        status = mapRakebackToMovementStatus(
          meta.rakeback_status as
            | "previsto"
            | "pendente"
            | "recebido"
            | "cancelado"
            | "expirado",
        );
      }
      if (movement.type === "bonus" && meta.bonus_status) {
        status = mapBonusToMovementStatus(
          meta.bonus_status as
            | "disponivel"
            | "pendente"
            | "creditado"
            | "utilizado"
            | "expirado"
            | "cancelado",
        );
      }

      await updateSimpleMovement({ ...values, status, metadata: meta });
      toast.success("Movimentação atualizada");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar lançamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Conta</Label>
            <Select
              value={selectedAccountId}
              onValueChange={(v) => v && form.setValue("account_id", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Moeda</Label>
            <Select
              value={selectedCurrencyId}
              onValueChange={(v) => v && form.setValue("currency_id", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectedAccount?.balances.map((b) => (
                  <SelectItem key={b.currency_id} value={b.currency_id}>
                    {b.currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {movement.type === "cashback" && (
            <div className="space-y-2">
              <Label>Status cashback</Label>
              <Select
                value={
                  (formMetadata?.cashback_status as string) ??
                  (metadata.cashback_status as string) ??
                  "pendente"
                }
                onValueChange={(v) =>
                  v &&
                  form.setValue("metadata", {
                    ...(form.getValues("metadata") ?? metadata),
                    cashback_status: v,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previsto">Previsto</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {movement.type === "rakeback" && (
            <div className="space-y-2">
              <Label>Status rakeback</Label>
              <Select
                value={
                  (formMetadata?.rakeback_status as string) ??
                  (metadata.rakeback_status as string) ??
                  "pendente"
                }
                onValueChange={(v) =>
                  v &&
                  form.setValue("metadata", {
                    ...(form.getValues("metadata") ?? metadata),
                    rakeback_status: v,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previsto">Previsto</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {movement.type === "bonus" && (
            <div className="space-y-2">
              <Label>Status bônus</Label>
              <Select
                value={
                  (formMetadata?.bonus_status as string) ??
                  (metadata.bonus_status as string) ??
                  "pendente"
                }
                onValueChange={(v) =>
                  v &&
                  form.setValue("metadata", {
                    ...(form.getValues("metadata") ?? metadata),
                    bonus_status: v,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="creditado">Creditado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                step="any"
                {...form.register("amount", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" {...form.register("occurred_at")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea rows={2} {...form.register("description")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
