"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createCapitalDeposit,
  createCapitalWithdrawal,
  updateCapitalMovement,
} from "@/features/movements/actions";
import {
  createCapitalDepositSchema,
  type CreateCapitalDepositInput,
} from "@/features/movements/schemas";
import type { AccountWithDetails, MovementWithDetails } from "@/shared/types/database";

interface CapitalMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "deposit" | "withdrawal";
  accounts: AccountWithDetails[];
  movement?: MovementWithDetails;
  defaultAccountId?: string;
  onSuccess?: () => void;
}

export function CapitalMovementDialog({
  open,
  onOpenChange,
  mode,
  accounts,
  movement,
  defaultAccountId,
  onSuccess,
}: CapitalMovementDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(movement);
  const effectiveMode =
    movement?.type === "capital_withdrawal" ? "withdrawal" : mode;

  const form = useForm<CreateCapitalDepositInput>({
    resolver: zodResolver(createCapitalDepositSchema),
    defaultValues: {
      account_id: "",
      currency_id: "",
      amount: 0,
      occurred_at: new Date().toISOString().slice(0, 10),
      description: "",
    },
  });

  const selectedAccountId = useWatch({
    control: form.control,
    name: "account_id",
  });
  const selectedCurrencyId = useWatch({
    control: form.control,
    name: "currency_id",
  });
  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId),
    [accounts, selectedAccountId],
  );

  useEffect(() => {
    if (!open) return;
    if (movement) {
      form.reset({
        account_id: movement.account_id,
        currency_id: movement.currency_id,
        amount: movement.amount,
        occurred_at: movement.occurred_at,
        description: movement.description ?? "",
      });
    } else {
      const account = accounts.find((a) => a.id === defaultAccountId) ?? accounts[0];
      form.reset({
        account_id: account?.id ?? "",
        currency_id: account?.default_currency_id ?? "",
        amount: 0,
        occurred_at: new Date().toISOString().slice(0, 10),
        description: "",
      });
    }
  }, [open, movement, accounts, defaultAccountId, form]);

  useEffect(() => {
    if (selectedAccount && !movement) {
      const hasCurrency = selectedAccount.balances.some(
        (b) => b.currency_id === form.getValues("currency_id"),
      );
      if (!hasCurrency) {
        form.setValue(
          "currency_id",
          selectedAccount.balances[0]?.currency_id ??
            selectedAccount.default_currency_id,
        );
      }
    }
  }, [selectedAccount, movement, form]);

  async function onSubmit(values: CreateCapitalDepositInput) {
    setLoading(true);
    try {
      if (isEditing && movement) {
        await updateCapitalMovement({ ...values, id: movement.id });
        toast.success("Movimentação atualizada");
      } else if (effectiveMode === "deposit") {
        await createCapitalDeposit(values);
        toast.success("Aporte registrado");
      } else {
        await createCapitalWithdrawal(values);
        toast.success("Retirada registrada");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  const title =
    effectiveMode === "deposit"
      ? isEditing
        ? "Editar aporte"
        : "Novo aporte"
      : isEditing
        ? "Editar retirada"
        : "Nova retirada";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {effectiveMode === "deposit"
              ? "Entrada de capital externo na operação."
              : "Saída de capital da operação para uso pessoal."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Conta</Label>
            <Select
              value={selectedAccountId}
              onValueChange={(v) => v && form.setValue("account_id", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.holder.name})
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
                {selectedAccount?.balances.map((balance) => (
                  <SelectItem key={balance.currency_id} value={balance.currency_id}>
                    {balance.currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="any"
                min="0.00000001"
                {...form.register("amount", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="occurred_at">Data</Label>
              <Input
                id="occurred_at"
                type="date"
                {...form.register("occurred_at")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" rows={2} {...form.register("description")} />
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
