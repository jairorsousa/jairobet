import { Suspense } from "react";
import { ArrowLeftRight } from "lucide-react";
import { listSelectableAccounts } from "@/features/accounts/actions";
import { listTransfers } from "@/features/movements/actions";
import { TransferActionButtons } from "@/features/transfers/components/transfer-action-buttons";
import { TransfersFilters } from "@/features/transfers/components/transfers-filters";
import { TransfersHistoryTable } from "@/features/transfers/components/transfers-history-table";
import { listHolders } from "@/features/holders/actions";
import { Header, PageContainer } from "@/shared/components/layout";
import type { TransferKind } from "@/shared/lib/domain/transfer-labels";
import type { MovementStatus } from "@/shared/types/database";

interface TransferenciasPageProps {
  searchParams: Promise<{
    kind?: string;
    status?: string;
    holder?: string;
    account?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function TransferenciasPage({
  searchParams,
}: TransferenciasPageProps) {
  const params = await searchParams;

  const [holders, accounts, transfers] = await Promise.all([
    listHolders(),
    listSelectableAccounts(),
    listTransfers({
      kind: (params.kind as TransferKind | undefined) ?? "all",
      status: (params.status as MovementStatus | undefined) ?? "all",
      holder_id: params.holder ?? "all",
      account_id: params.account ?? "all",
      from_date: params.from,
      to_date: params.to,
    }),
  ]);

  const pendingCount = transfers.filter((t) => t.status === "pending").length;

  return (
    <>
      <Header
        title="Transferências"
        icon={<ArrowLeftRight className="size-5 text-primary" />}
      />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight">
                Transferências
              </h2>
              <p className="text-muted-foreground">
                Histórico de transferências, depósitos, saques e trades entre
                contas.
                {pendingCount > 0
                  ? ` ${pendingCount} pendente${pendingCount > 1 ? "s" : ""} aguardando confirmação.`
                  : ""}
              </p>
            </div>
            <TransferActionButtons />
          </div>

          <Suspense
            fallback={<div className="h-24 animate-pulse rounded-lg bg-muted" />}
          >
            <TransfersFilters holders={holders} accounts={accounts} />
          </Suspense>

          <Suspense
            fallback={<div className="h-32 animate-pulse rounded-lg bg-muted" />}
          >
            <TransfersHistoryTable transfers={transfers} />
          </Suspense>
        </div>
      </PageContainer>
    </>
  );
}