"use client";

import { useState } from "react";
import { Landmark, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteBank } from "@/features/banks/actions";
import { BankFormDialog } from "@/features/banks/components/bank-form-dialog";
import { holderStatusLabels } from "@/shared/constants/labels";
import type { BankWithStats } from "@/shared/types/database";

interface BanksListProps {
  banks: BankWithStats[];
}

export function BanksList({ banks: initialBanks }: BanksListProps) {
  const [banks, setBanks] = useState(initialBanks);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BankWithStats | null>(null);
  const [deleting, setDeleting] = useState<BankWithStats | null>(null);

  function refreshList() {
    window.location.reload();
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteBank(deleting.id);
      setBanks((prev) => prev.filter((b) => b.id !== deleting.id));
      toast.success("Banco excluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {banks.length} banco{banks.length !== 1 ? "s" : ""}
        </p>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Novo banco
        </Button>
      </div>

      {banks.length === 0 ? (
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Landmark className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhum banco cadastrado. Crie o primeiro para vincular contas.
            </p>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              Criar banco
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {banks.map((bank) => (
            <Card key={bank.id} className="glass-card border-border/50">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{bank.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {bank.account_count} conta
                    {bank.account_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" aria-label="Ações">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(bank);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleting(bank)}
                    >
                      <Trash2 className="size-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge
                  variant="outline"
                  className={
                    bank.status === "active"
                      ? "border-success/30 text-success"
                      : ""
                  }
                >
                  {holderStatusLabels[bank.status]}
                </Badge>
                {bank.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {bank.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BankFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bank={editing}
        onSuccess={refreshList}
      />

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir banco?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.account_count
                ? "Este banco possui contas vinculadas e não pode ser excluído."
                : `Confirma a exclusão de "${deleting?.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={(deleting?.account_count ?? 0) > 0}
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