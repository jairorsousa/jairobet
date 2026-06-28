"use client";

import { NewMovementDialog } from "@/features/movements/components/new-movement-dialog";
import { MovementsList } from "@/features/movements/components/movements-list";
import type { AccountWithDetails, MovementWithDetails } from "@/shared/types/database";

interface MovementsPageClientProps {
  movements: MovementWithDetails[];
  accounts: AccountWithDetails[];
}

export function MovementsPageClient({
  movements,
  accounts,
}: MovementsPageClientProps) {
  function handleRefresh() {
    window.location.reload();
  }

  return (
    <>
      <NewMovementDialog accounts={accounts} onSuccess={handleRefresh} />
      <MovementsList movements={movements} accounts={accounts} />
    </>
  );
}