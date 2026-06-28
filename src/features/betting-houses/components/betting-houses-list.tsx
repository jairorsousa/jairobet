"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2, Trophy } from "lucide-react";
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
import { deleteBettingHouse } from "@/features/betting-houses/actions";
import { BettingHouseFormDialog } from "@/features/betting-houses/components/betting-house-form-dialog";
import { holderStatusLabels } from "@/shared/constants/labels";
import type { BettingHouseWithStats } from "@/shared/types/database";

interface BettingHousesListProps {
  houses: BettingHouseWithStats[];
}

export function BettingHousesList({ houses: initialHouses }: BettingHousesListProps) {
  const [houses, setHouses] = useState(initialHouses);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BettingHouseWithStats | null>(null);
  const [deleting, setDeleting] = useState<BettingHouseWithStats | null>(null);

  function refreshList() {
    window.location.reload();
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteBettingHouse(deleting.id);
      setHouses((prev) => prev.filter((h) => h.id !== deleting.id));
      toast.success("Casa de apostas excluída");
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
          {houses.length} casa{houses.length !== 1 ? "s" : ""} de apostas
        </p>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Nova casa
        </Button>
      </div>

      {houses.length === 0 ? (
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Trophy className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhuma casa cadastrada. Crie a primeira para vincular contas.
            </p>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              Criar casa de apostas
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {houses.map((house) => (
            <Card key={house.id} className="glass-card border-border/50">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{house.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {house.account_count} conta
                    {house.account_count !== 1 ? "s" : ""}
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
                        setEditing(house);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleting(house)}
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
                    house.status === "active"
                      ? "border-success/30 text-success"
                      : ""
                  }
                >
                  {holderStatusLabels[house.status]}
                </Badge>
                {house.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {house.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BettingHouseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        house={editing}
        onSuccess={refreshList}
      />

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir casa de apostas?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.account_count
                ? "Esta casa possui contas vinculadas e não pode ser excluída."
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