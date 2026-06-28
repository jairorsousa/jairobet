"use client";

import { MovementRow } from "@/features/movements/components/movement-row";
import type {
  AccountWithDetails,
  MovementWithDetails,
} from "@/shared/types/database";

interface MovementsListProps {
  movements: MovementWithDetails[];
  accounts?: AccountWithDetails[];
}

export function MovementsList({ movements, accounts = [] }: MovementsListProps) {
  function handleRefresh() {
    window.location.reload();
  }

  if (movements.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/50 py-12 text-center text-muted-foreground">
        Nenhuma movimentação encontrada.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {movements.map((movement) => (
        <MovementRow
          key={movement.id}
          movement={movement}
          accounts={accounts}
          onRefresh={handleRefresh}
        />
      ))}
    </div>
  );
}