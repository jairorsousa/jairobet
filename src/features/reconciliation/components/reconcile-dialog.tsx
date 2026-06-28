"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { createReconciliation } from "@/features/reconciliation/actions";
import { createReconciliationSchema } from "@/features/reconciliation/schemas";
import { formatMoney } from "@/shared/lib/money/format";
import type { ReconciliationOverviewRow } from "@/shared/types/database";
import { cn } from "@/lib/utils";

interface ReconcileDialogProps {
  row: ReconciliationOverviewRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type FormValues = z.infer<typeof createReconciliationSchema>;

export function ReconcileDialog({
  row,
  open,
  onOpenChange,
  onSuccess,
}: ReconcileDialogProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"save" | "adjust">("save");

  const form = useForm<FormValues>({
    resolver: zodResolver(createReconciliationSchema),
    defaultValues: {
      account_id: "",
      currency_id: "",
      reported_balance: 0,
      reconciled_at: new Date().toISOString().slice(0, 10),
      notes: "",
      create_adjustment: false,
    },
  });

  useEffect(() => {
    if (!row || !open) return;
    form.reset({
      account_id: row.account_id,
      currency_id: row.currency_id,
      reported_balance: row.calculated_balance,
      reconciled_at: new Date().toISOString().slice(0, 10),
      notes: "",
      create_adjustment: false,
    });
  }, [row, open, form]);

  const reported = form.watch("reported_balance");
  const difference = useMemo(() => {
    if (!row) return 0;
    return Number(reported) - row.calculated_balance;
  }, [reported, row]);

  async function handleSubmit(values: FormValues) {
    if (!row) return;
    setLoading(true);
    try {
      await createReconciliation({
        ...values,
        create_adjustment: mode === "adjust",
      });
      toast.success(
        mode === "adjust"
          ? "Conciliação salva e ajuste criado"
          : "Conciliação salva",
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conciliar saldo</DialogTitle>
          <DialogDescription>
            {row.account_name} · {row.currency_code} ({row.holder_name})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm">
            <p className="text-muted-foreground">Saldo calculado pelo sistema</p>
            <p className="font-medium">
              {formatMoney(
                row.calculated_balance,
                row.currency_code,
                row.currency_decimal_places,
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Saldo informado (real)</Label>
            <Input
              type="number"
              step="any"
              {...form.register("reported_balance", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label>Data da conferência</Label>
            <Input type="date" {...form.register("reconciled_at")} />
          </div>

          <div
            className={cn(
              "rounded-lg border p-3 text-sm",
              difference === 0
                ? "border-success/30 bg-success/10"
                : "border-warning/30 bg-warning/10",
            )}
          >
            <p className="text-muted-foreground">Diferença</p>
            <p
              className={cn(
                "font-medium",
                difference > 0 && "text-success",
                difference < 0 && "text-destructive",
              )}
            >
              {difference > 0 ? "+" : ""}
              {formatMoney(
                difference,
                row.currency_code,
                row.currency_decimal_places,
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea rows={2} {...form.register("notes")} />
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              onClick={() => setMode("save")}
            >
              {loading && mode === "save" ? "Salvando…" : "Salvar conciliação"}
            </Button>
            {difference !== 0 ? (
              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={loading}
                onClick={() => setMode("adjust")}
              >
                {loading && mode === "adjust"
                  ? "Salvando…"
                  : "Salvar e criar ajuste de saldo"}
              </Button>
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}