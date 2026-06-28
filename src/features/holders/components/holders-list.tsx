"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react";
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
import { deleteHolder } from "@/features/holders/actions";
import { HolderFormDialog } from "@/features/holders/components/holder-form-dialog";
import { holderStatusLabels } from "@/shared/constants/labels";
import type { HolderWithStats } from "@/shared/types/database";

interface HoldersListProps {
  holders: HolderWithStats[];
}

export function HoldersList({ holders: initialHolders }: HoldersListProps) {
  const [holders, setHolders] = useState(initialHolders);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HolderWithStats | null>(null);
  const [deleting, setDeleting] = useState<HolderWithStats | null>(null);

  function refreshList() {
    window.location.reload();
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteHolder(deleting.id);
      setHolders((prev) => prev.filter((h) => h.id !== deleting.id));
      toast.success("Titular excluído");
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
          {holders.length} titular{holders.length !== 1 ? "es" : ""}
        </p>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Novo titular
        </Button>
      </div>

      {holders.length === 0 ? (
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Users className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhum titular cadastrado. Crie o primeiro para vincular contas.
            </p>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              Criar titular
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {holders.map((holder) => (
            <Card key={holder.id} className="glass-card border-border/50">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{holder.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {holder.account_count} conta
                    {holder.account_count !== 1 ? "s" : ""}
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
                        setEditing(holder);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleting(holder)}
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
                    holder.status === "active"
                      ? "border-success/30 text-success"
                      : ""
                  }
                >
                  {holderStatusLabels[holder.status]}
                </Badge>
                {holder.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {holder.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <HolderFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        holder={editing}
        onSuccess={refreshList}
      />

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir titular?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.account_count
                ? "Este titular possui contas vinculadas e não pode ser excluído."
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