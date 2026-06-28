import { Suspense } from "react";
import { BarChart3 } from "lucide-react";
import { listSelectableAccounts } from "@/features/accounts/actions";
import { listMovements } from "@/features/movements/actions";
import { MovementsFilters } from "@/features/movements/components/movements-filters";
import { MovementsPageClient } from "@/features/movements/components/movements-page-client";
import { listHolders } from "@/features/holders/actions";
import { Header, PageContainer } from "@/shared/components/layout";
import type { MovementType } from "@/shared/types/database";

interface MovimentacoesPageProps {
  searchParams: Promise<{
    type?: string;
    holder?: string;
    account?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function MovimentacoesPage({
  searchParams,
}: MovimentacoesPageProps) {
  const params = await searchParams;

  const [holders, accounts, { items: movements }] = await Promise.all([
    listHolders(),
    listSelectableAccounts(),
    listMovements({
      type: (params.type as MovementType | undefined) ?? "all",
      holder_id: params.holder ?? "all",
      account_id: params.account ?? "all",
      from_date: params.from,
      to_date: params.to,
      page: params.page ? parseInt(params.page, 10) : 1,
    }),
  ]);

  return (
    <>
      <Header
        title="Movimentações"
        icon={<BarChart3 className="size-5 text-primary" />}
      />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Histórico
            </h2>
            <p className="text-muted-foreground">
              Aportes, retiradas, transferências e demais lançamentos.
            </p>
          </div>

          <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-muted" />}>
            <MovementsFilters holders={holders} accounts={accounts} />
          </Suspense>

          <Suspense fallback={<div className="h-32 animate-pulse rounded-lg bg-muted" />}>
            <MovementsPageClient movements={movements} accounts={accounts} />
          </Suspense>
        </div>
      </PageContainer>
    </>
  );
}