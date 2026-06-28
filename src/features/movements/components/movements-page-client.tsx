"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CapitalMovementDialog } from "@/features/movements/components/capital-movement-dialog";
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
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);

  function handleRefresh() {
    window.location.reload();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setDepositOpen(true)}>
          <ArrowDownLeft className="size-4" />
          Aporte
        </Button>
        <Button variant="outline" onClick={() => setWithdrawalOpen(true)}>
          <ArrowUpRight className="size-4" />
          Retirada
        </Button>
      </div>

      <MovementsList movements={movements} accounts={accounts} />

      <CapitalMovementDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        mode="deposit"
        accounts={accounts}
        onSuccess={handleRefresh}
      />
      <CapitalMovementDialog
        open={withdrawalOpen}
        onOpenChange={setWithdrawalOpen}
        mode="withdrawal"
        accounts={accounts}
        onSuccess={handleRefresh}
      />
    </>
  );
}