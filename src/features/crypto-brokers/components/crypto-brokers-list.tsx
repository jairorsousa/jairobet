"use client";

import { useState } from "react";
import { Bitcoin, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
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
import { deleteCryptoBroker } from "@/features/crypto-brokers/actions";
import { CryptoBrokerFormDialog } from "@/features/crypto-brokers/components/crypto-broker-form-dialog";
import { holderStatusLabels } from "@/shared/constants/labels";
import type { CryptoBrokerWithStats } from "@/shared/types/database";

interface CryptoBrokersListProps {
  brokers: CryptoBrokerWithStats[];
}

export function CryptoBrokersList({ brokers: initialBrokers }: CryptoBrokersListProps) {
  const [brokers, setBrokers] = useState(initialBrokers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CryptoBrokerWithStats | null>(null);
  const [deleting, setDeleting] = useState<CryptoBrokerWithStats | null>(null);

  function refreshList() {
    window.location.reload();
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteCryptoBroker(deleting.id);
      setBrokers((prev) => prev.filter((b) => b.id !== deleting.id));
      toast.success("Corretora excluída");
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
          {brokers.length} corretora{brokers.length !== 1 ? "s" : ""}
        </p>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Nova corretora
        </Button>
      </div>

      {brokers.length === 0 ? (
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Bitcoin className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhuma corretora cadastrada. Crie a primeira para vincular contas.
            </p>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              Criar corretora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brokers.map((broker) => (
            <Card key={broker.id} className="glass-card border-border/50">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{broker.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {broker.account_count} conta
                    {broker.account_count !== 1 ? "s" : ""}
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
                        setEditing(broker);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleting(broker)}
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
                    broker.status === "active"
                      ? "border-success/30 text-success"
                      : ""
                  }
                >
                  {holderStatusLabels[broker.status]}
                </Badge>
                {broker.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {broker.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CryptoBrokerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        broker={editing}
        onSuccess={refreshList}
      />

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir corretora?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.account_count
                ? "Esta corretora possui contas vinculadas e não pode ser excluída."
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