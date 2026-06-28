import {
  ArrowLeftRight,
  Gift,
  Landmark,
  Percent,
  Receipt,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardKpis } from "@/features/dashboard/lib/compute-dashboard";
import { accountTypeLabels } from "@/shared/constants/labels";
import { formatMoney } from "@/shared/lib/money/format";
import { cn } from "@/lib/utils";

interface DashboardKpiGridProps {
  kpis: DashboardKpis;
}

function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2).replace(".", ",")}%`;
}

function ResultValue({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "font-display text-3xl",
        value > 0 && "text-success",
        value < 0 && "text-destructive",
        value === 0 && "text-gradient-gold",
      )}
    >
      {value > 0 ? "+" : ""}
      {formatMoney(value, "BRL")}
    </span>
  );
}

export function DashboardKpiGrid({ kpis }: DashboardKpiGridProps) {
  const activeTotal =
    kpis.activeAccountsByType.bank +
    kpis.activeAccountsByType.crypto +
    kpis.activeAccountsByType.betting;

  const cards = [
    {
      label: "Patrimônio total",
      description: "Saldos + valores em trânsito",
      icon: Wallet,
      value: formatMoney(kpis.totalPatrimony, "BRL"),
      valueClass: "text-gradient-gold",
    },
    {
      label: "Capital líquido",
      description: `Aportes ${formatMoney(kpis.totalDeposits, "BRL")} − retiradas ${formatMoney(kpis.totalWithdrawals, "BRL")}`,
      icon: Landmark,
      value: formatMoney(kpis.netCapital, "BRL"),
      valueClass: "text-gradient-gold",
    },
    {
      label: "Resultado acumulado",
      description: "Patrimônio − capital líquido",
      icon: kpis.accumulatedResult >= 0 ? TrendingUp : TrendingDown,
      customValue: <ResultValue value={kpis.accumulatedResult} />,
    },
    {
      label: "Resultado no mês",
      description: "Variação desde o início do mês",
      icon: RotateCcw,
      customValue: <ResultValue value={kpis.monthResult} />,
    },
    {
      label: "ROI",
      description:
        kpis.roi === null ? "Capital líquido zero" : "Sobre capital aportado",
      icon: Percent,
      value: kpis.roi === null ? "—" : formatPercent(kpis.roi),
      valueClass: "text-gradient-gold",
    },
    {
      label: "Em trânsito",
      description: "Transferências pendentes",
      icon: ArrowLeftRight,
      value: formatMoney(kpis.inTransit, "BRL"),
      valueClass: kpis.inTransit > 0 ? "text-warning" : "text-muted-foreground",
    },
    {
      label: "Taxas pagas",
      description: "Total acumulado",
      icon: Receipt,
      value: formatMoney(kpis.totalFees, "BRL"),
      valueClass: "text-destructive",
    },
    {
      label: "Cashback recebido",
      description: "Somente status recebido",
      icon: Gift,
      value: formatMoney(kpis.realizedCashback, "BRL"),
      valueClass: "text-success",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="gradient-card border-border/50">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-1">
                <CardDescription>{card.label}</CardDescription>
                {card.customValue ? (
                  <CardTitle className="font-display text-3xl">
                    {card.customValue}
                  </CardTitle>
                ) : (
                  <CardTitle
                    className={cn("font-display text-3xl", card.valueClass)}
                  >
                    {card.value}
                  </CardTitle>
                )}
              </div>
              <card.icon className="size-5 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {activeTotal} contas ativas — {kpis.activeAccountsByType.bank}{" "}
        {accountTypeLabels.bank.toLowerCase()}, {kpis.activeAccountsByType.crypto}{" "}
        {accountTypeLabels.crypto.toLowerCase()},{" "}
        {kpis.activeAccountsByType.betting}{" "}
        {accountTypeLabels.betting.toLowerCase()}
        {kpis.realizedBonuses > 0
          ? ` · Bônus recebidos: ${formatMoney(kpis.realizedBonuses, "BRL")}`
          : ""}
      </p>
    </div>
  );
}