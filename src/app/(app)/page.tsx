import { Suspense } from "react";
import { LayoutDashboard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { getDashboardData } from "@/features/dashboard/actions";
import { DashboardAccountGroups } from "@/features/dashboard/components/dashboard-account-groups";
import {
  DashboardEvolutionChart,
  DashboardPieCharts,
} from "@/features/dashboard/components/dashboard-charts";
import { DashboardFilters } from "@/features/dashboard/components/dashboard-filters";
import { DashboardKpiGrid } from "@/features/dashboard/components/dashboard-kpi-grid";
import { DashboardPendingSection } from "@/features/dashboard/components/dashboard-pending-section";
import type { DashboardPeriod } from "@/features/dashboard/lib/compute-dashboard";
import { Header, PageContainer } from "@/shared/components/layout";

interface DashboardPageProps {
  searchParams: Promise<{
    holder?: string;
    period?: string;
  }>;
}

const validPeriods: DashboardPeriod[] = ["7d", "30d", "month", "year"];

function parsePeriod(value?: string): DashboardPeriod {
  if (value && validPeriods.includes(value as DashboardPeriod)) {
    return value as DashboardPeriod;
  }
  return "30d";
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const holderId = params.holder ?? "all";
  const period = parsePeriod(params.period);

  const data = await getDashboardData(holderId, period);

  return (
    <>
      <Header
        title="Dashboard"
        icon={<LayoutDashboard className="size-5 text-primary" />}
        rightAction={<LogoutButton />}
      />
      <PageContainer>
        <div className="space-y-8 animate-fade-in">
          <div className="space-y-4">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight">
                Visão geral
              </h2>
              <p className="text-muted-foreground">
                Patrimônio, resultado e pendências da operação.
              </p>
            </div>
            <Suspense
              fallback={
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-56" />
                  <Skeleton className="h-10 w-44" />
                </div>
              }
            >
              <DashboardFilters
                holders={data.holders}
                holderId={data.holderId}
                period={data.period}
              />
            </Suspense>
          </div>

          <DashboardKpiGrid kpis={data.kpis} />

          <DashboardPieCharts
            equityByHolder={data.equityByHolder}
            equityByAccountType={data.equityByAccountType}
            receivedBonusesByType={data.receivedBonusesByType}
            holderId={data.holderId}
          />

          <DashboardEvolutionChart
            timeSeries={data.timeSeries}
            period={data.period}
          />

          <section className="space-y-4">
            <div>
              <h3 className="font-heading text-lg font-semibold">Contas</h3>
              <p className="text-sm text-muted-foreground">
                Saldos agrupados por tipo de conta
              </p>
            </div>
            <DashboardAccountGroups
              accounts={data.accounts}
              holderId={data.holderId}
              flaggedAccountIds={data.flaggedAccountIds}
            />
          </section>

          <DashboardPendingSection
            transfers={data.pendingTransfers}
            holderId={data.holderId}
          />
        </div>
      </PageContainer>
    </>
  );
}