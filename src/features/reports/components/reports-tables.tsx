import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { accountTypeLabels } from "@/shared/constants/labels";
import { formatMoney } from "@/shared/lib/money/format";
import type {
  AccountReportRow,
  HolderReportRow,
  ResultReport,
} from "@/features/reports/lib/compute-reports";
import { cn } from "@/lib/utils";

function ResultValue({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "font-medium",
        value > 0 && "text-success",
        value < 0 && "text-destructive",
      )}
    >
      {value > 0 ? "+" : ""}
      {formatMoney(value, "BRL")}
    </span>
  );
}

export function ResultReportCards({ report }: { report: ResultReport }) {
  const items = [
    { label: "Patrimônio início", value: formatMoney(report.startPatrimony, "BRL") },
    { label: "Patrimônio fim", value: formatMoney(report.endPatrimony, "BRL") },
    { label: "Aportes no período", value: formatMoney(report.deposits, "BRL") },
    {
      label: "Retiradas no período",
      value: formatMoney(report.withdrawals, "BRL"),
    },
    {
      label: "Resultado no período",
      custom: <ResultValue value={report.periodResult} />,
    },
    {
      label: "Resultado acumulado",
      custom: <ResultValue value={report.accumulatedResult} />,
    },
    {
      label: "ROI",
      value: report.roi === null ? "—" : `${report.roi.toFixed(2).replace(".", ",")}%`,
    },
    { label: "Taxas", value: formatMoney(report.fees, "BRL"), negative: true },
    { label: "Cashback", value: formatMoney(report.cashback, "BRL") },
    { label: "Bônus", value: formatMoney(report.bonuses, "BRL") },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="font-display text-2xl text-gradient-gold">
              {item.custom ?? (
                <span className={item.negative ? "text-destructive" : undefined}>
                  {item.value}
                </span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export function AccountReportTable({
  rows,
  emptyMessage,
}: {
  rows: AccountReportRow[];
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/50 py-12 text-center text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border/50">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Conta</th>
            <th className="px-4 py-3 font-medium">Titular</th>
            <th className="px-4 py-3 font-medium text-right">Saldo fim</th>
            <th className="px-4 py-3 font-medium text-right">Aportes</th>
            <th className="px-4 py-3 font-medium text-right">Cashback</th>
            <th className="px-4 py-3 font-medium text-right">Taxas</th>
            <th className="px-4 py-3 font-medium text-right">Resultado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.accountId} className="border-t border-border/50">
              <td className="px-4 py-3">
                <div>{row.accountName}</div>
                <div className="text-xs text-muted-foreground">
                  {accountTypeLabels[row.accountType]}
                </div>
              </td>
              <td className="px-4 py-3">{row.holderName}</td>
              <td className="px-4 py-3 text-right">
                {formatMoney(row.endBalanceBrl, "BRL")}
              </td>
              <td className="px-4 py-3 text-right">
                {formatMoney(row.deposits, "BRL")}
              </td>
              <td className="px-4 py-3 text-right">
                {formatMoney(row.cashback, "BRL")}
              </td>
              <td className="px-4 py-3 text-right text-destructive">
                {formatMoney(row.fees, "BRL")}
              </td>
              <td className="px-4 py-3 text-right">
                <ResultValue value={row.result} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function HolderReportTable({ rows }: { rows: HolderReportRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/50 py-12 text-center text-muted-foreground">
        Nenhum titular com contas no período.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border/50">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Titular</th>
            <th className="px-4 py-3 font-medium text-right">Contas</th>
            <th className="px-4 py-3 font-medium text-right">Patrimônio</th>
            <th className="px-4 py-3 font-medium text-right">Aportes</th>
            <th className="px-4 py-3 font-medium text-right">Retiradas</th>
            <th className="px-4 py-3 font-medium text-right">Resultado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.holderId} className="border-t border-border/50">
              <td className="px-4 py-3 font-medium">{row.holderName}</td>
              <td className="px-4 py-3 text-right">{row.accountCount}</td>
              <td className="px-4 py-3 text-right">
                {formatMoney(row.endPatrimony, "BRL")}
              </td>
              <td className="px-4 py-3 text-right">
                {formatMoney(row.deposits, "BRL")}
              </td>
              <td className="px-4 py-3 text-right">
                {formatMoney(row.withdrawals, "BRL")}
              </td>
              <td className="px-4 py-3 text-right">
                <ResultValue value={row.result} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}