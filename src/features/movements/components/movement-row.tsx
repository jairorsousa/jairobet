"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
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
import { deleteMovement } from "@/features/movements/actions";
import { CapitalMovementDialog } from "@/features/movements/components/capital-movement-dialog";
import {
  movementStatusLabels,
  movementTypeLabels,
} from "@/shared/lib/domain/movement-labels";
import { formatMoney } from "@/shared/lib/money/format";
import type {
  AccountWithDetails,
  MovementWithDetails,
} from "@/shared/types/database";
import { cn } from "@/lib/utils";

interface MovementRowProps {
  movement: MovementWithDetails;
  accounts: AccountWithDetails[];
  onRefresh?: () => void;
}

export function MovementRow({ movement, accounts, onRefresh }: MovementRowProps) {
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const isCredit = movement.direction === "credit";
  const isPending = movement.status === "pending";
  const canEdit = ["capital_deposit", "capital_withdrawal"].includes(
    movement.type,
  );

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteMovement(movement.id);
      toast.success("Movimentação excluída");
      onRefresh?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setLoading(false);
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/50 p-4">
        <div
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
            isCredit ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {isCredit ? (
            <ArrowDownLeft className="size-4" />
          ) : (
            <ArrowUpRight className="size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {movementTypeLabels[movement.type]}
            </span>
            <Badge variant="outline" className="text-xs">
              {movement.account.name}
            </Badge>
            {movement.counter_account && (
              <span className="text-xs text-muted-foreground">
                → {movement.counter_account.name}
              </span>
            )}
            {isPending && (
              <Badge className="border-0 bg-warning/15 text-warning">
                {movementStatusLabels[movement.status]}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {movement.description ?? "—"} · {movement.account.holder.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(movement.occurred_at + "T12:00:00").toLocaleDateString(
              "pt-BR",
            )}
          </p>
        </div>
        <div className="text-right">
          <p
            className={cn(
              "font-medium",
              isCredit ? "text-success" : "text-destructive",
            )}
          >
            {isCredit ? "+" : "−"}
            {formatMoney(
              movement.amount,
              movement.currency.code,
              movement.currency.decimal_places,
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatMoney(movement.amount_brl, "BRL")}
          </p>
          <div className="mt-2 flex justify-end gap-1">
            {canEdit && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Editar"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Excluir"
              onClick={() => setDeleting(true)}
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      </div>

      {canEdit && (
        <CapitalMovementDialog
          open={editing}
          onOpenChange={setEditing}
          mode={
            movement.type === "capital_withdrawal" ? "withdrawal" : "deposit"
          }
          accounts={accounts}
          movement={movement}
          onSuccess={onRefresh}
        />
      )}

      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir movimentação?</AlertDialogTitle>
            <AlertDialogDescription>
              O saldo da conta será recalculado automaticamente.
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