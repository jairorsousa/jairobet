import { Suspense } from "react";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getReportsData, type ReportTab } from "@/features/reports/actions";
import { ReportsPeriodFilter } from "@/features/reports/components/reports-period-filter";
import { ReportsTabs } from "@/features/reports/components/reports-tabs";
import { Header, PageContainer } from "@/shared/components/layout";

interface RelatoriosPageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    tab?: string;
  }>;
}

const validTabs: ReportTab[] = ["resultado", "betting", "conta", "titular"];

function parseTab(value?: string): ReportTab {
  if (value && validTabs.includes(value as ReportTab)) {
    return value as ReportTab;
  }
  return "resultado";
}

export default async function RelatoriosPage({
  searchParams,
}: RelatoriosPageProps) {
  const params = await searchParams;
  const tab = parseTab(params.tab);
  const data = await getReportsData(params.from, params.to, tab);

  return (
    <>
      <Header
        title="Relatórios"
        icon={<BarChart3 className="size-5 text-primary" />}
      />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Análise por período
            </h2>
            <p className="text-muted-foreground">
              Resultado consolidado, por casa de apostas, conta e titular.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            }
          >
            <ReportsPeriodFilter from={data.period.from} to={data.period.to} />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <ReportsTabs data={data} />
          </Suspense>
        </div>
      </PageContainer>
    </>
  );
}