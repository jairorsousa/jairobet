"use client";

import { useSearchParams } from "next/navigation";
import { NewMovementDialog } from "@/features/movements/components/new-movement-dialog";
import { MovementsList } from "@/features/movements/components/movements-list";
import { ExportCsvButton } from "@/shared/components/export-csv-button";
import type { AccountWithDetails, MovementWithDetails } from "@/shared/types/database";

interface MovementsPageClientProps {
  movements: MovementWithDetails[];
  accounts: AccountWithDetails[];
}

export function MovementsPageClient({
  movements,
  accounts,
}: MovementsPageClientProps) {
  const searchParams = useSearchParams();

  function handleRefresh() {
    window.location.reload();
  }

  const exportParams = new URLSearchParams();
  for (const key of ["from", "to", "type", "holder", "account"] as const) {
    const value = searchParams.get(key);
    if (value) exportParams.set(key, value);
  }
  const exportHref = `/api/export/movements?${exportParams.toString()}`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NewMovementDialog accounts={accounts} onSuccess={handleRefresh} />
        <ExportCsvButton href={exportHref} />
      </div>
      <MovementsList movements={movements} accounts={accounts} />
    </>
  );
}