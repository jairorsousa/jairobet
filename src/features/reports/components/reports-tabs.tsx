"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AccountReportTable,
  HolderReportTable,
  ResultReportCards,
} from "@/features/reports/components/reports-tables";
import type { ReportsData } from "@/features/reports/actions";
import { ExportCsvButton } from "@/shared/components/export-csv-button";

interface ReportsTabsProps {
  data: ReportsData;
}

function buildExportHref(
  scope: string,
  period: { from: string; to: string },
): string {
  const params = new URLSearchParams({
    scope,
    from: period.from,
    to: period.to,
  });
  return `/api/export/result?${params.toString()}`;
}

export function ReportsTabs({ data }: ReportsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = data.tab;

  function onTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`/relatorios?${params.toString()}`);
  }

  return (
    <Tabs value={tab} onValueChange={onTabChange}>
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="resultado">Resultado</TabsTrigger>
        <TabsTrigger value="betting">Casas de apostas</TabsTrigger>
        <TabsTrigger value="conta">Por conta</TabsTrigger>
        <TabsTrigger value="titular">Por titular</TabsTrigger>
      </TabsList>

      <TabsContent value="resultado" className="mt-6 space-y-4">
        <div className="flex justify-end">
          <ExportCsvButton href={buildExportHref("resumo", data.period)} />
        </div>
        <ResultReportCards report={data.result} />
      </TabsContent>

      <TabsContent value="betting" className="mt-6 space-y-4">
        <div className="flex justify-end">
          <ExportCsvButton href={buildExportHref("betting", data.period)} />
        </div>
        <AccountReportTable
          rows={data.bettingRows}
          emptyMessage="Nenhuma casa de apostas cadastrada."
        />
      </TabsContent>

      <TabsContent value="conta" className="mt-6 space-y-4">
        <div className="flex justify-end">
          <ExportCsvButton href={buildExportHref("conta", data.period)} />
        </div>
        <AccountReportTable
          rows={data.accountRows}
          emptyMessage="Nenhuma conta ativa no período."
        />
      </TabsContent>

      <TabsContent value="titular" className="mt-6 space-y-4">
        <div className="flex justify-end">
          <ExportCsvButton href={buildExportHref("titular", data.period)} />
        </div>
        <HolderReportTable rows={data.holderRows} />
      </TabsContent>
    </Tabs>
  );
}