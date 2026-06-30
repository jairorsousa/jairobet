"use client";

import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  DashboardPeriod,
  PieSlice,
  TimeSeriesPoint,
} from "@/features/dashboard/lib/compute-dashboard";
import { formatMoney } from "@/shared/lib/money/format";

const CHART_COLORS = [
  "hsl(45 93% 47%)",
  "hsl(142 70% 45%)",
  "hsl(199 89% 48%)",
  "hsl(38 92% 50%)",
  "hsl(0 84% 60%)",
];

function formatBrlTooltip(value: number | string | undefined) {
  if (value === undefined) return "";
  return formatMoney(Number(value), "BRL");
}

interface DashboardPieChartsProps {
  equityByHolder: PieSlice[];
  equityByAccountType: PieSlice[];
  receivedBonusesByType: PieSlice[];
  holderId: string;
}

function BonusPieCard({ data }: { data: PieSlice[] }) {
  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="text-base">Bônus recebidos por tipo</CardTitle>
        <CardDescription>Cashback, rakeback e bônus em BRL</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Nenhum bônus recebido registrado.
          </p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={index}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatBrlTooltip(value as number)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPieCharts({
  equityByHolder,
  equityByAccountType,
  receivedBonusesByType,
  holderId,
}: DashboardPieChartsProps) {
  const showHolderChart = holderId === "all" && equityByHolder.length > 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {showHolderChart ? (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Patrimônio por titular</CardTitle>
            <CardDescription>Distribuição em BRL</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={equityByHolder}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {equityByHolder.map((_, index) => (
                      <Cell
                        key={index}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatBrlTooltip(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Patrimônio por tipo de conta</CardTitle>
          <CardDescription>Banco, cripto e casas de apostas</CardDescription>
        </CardHeader>
        <CardContent>
          {equityByAccountType.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Sem saldos para exibir.
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={equityByAccountType}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {equityByAccountType.map((_, index) => (
                      <Cell
                        key={index}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatBrlTooltip(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <BonusPieCard data={receivedBonusesByType} />
    </div>
  );
}

interface DashboardEvolutionChartProps {
  timeSeries: TimeSeriesPoint[];
  period: DashboardPeriod;
}

const periodLabels: Record<DashboardPeriod, string> = {
  "7d": "últimos 7 dias",
  "30d": "últimos 30 dias",
  month: "mês atual",
  year: "ano atual",
};

export function DashboardEvolutionChart({
  timeSeries,
  period,
}: DashboardEvolutionChartProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Resultado por dia</CardTitle>
          <CardDescription>
            Variação diária do resultado — {periodLabels[period]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeSeries.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Sem dados no período selecionado.
            </p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeries}>
                  <CartesianGrid
                    vertical={false}
                    stroke="hsl(222 30% 18%)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat("pt-BR", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(v)
                    }
                  />
                  <Tooltip
                    formatter={(value) => formatBrlTooltip(value as number)}
                  />
                  <Bar
                    dataKey="dailyResult"
                    name="Resultado do dia"
                    radius={[4, 4, 0, 0]}
                  >
                    {timeSeries.map((point) => (
                      <Cell
                        key={point.date}
                        fill={
                          point.dailyResult >= 0
                            ? "hsl(142 70% 45%)"
                            : "hsl(0 84% 60%)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Resultado acumulado</CardTitle>
          <CardDescription>
            Resultado acumulado da operação — {periodLabels[period]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeSeries.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Sem dados no período selecionado.
            </p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeries}>
                  <CartesianGrid
                    vertical={false}
                    stroke="hsl(222 30% 18%)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat("pt-BR", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(v)
                    }
                  />
                  <Tooltip
                    formatter={(value) => formatBrlTooltip(value as number)}
                  />
                  <Line
                    type="monotone"
                    dataKey="result"
                    name="Resultado acumulado"
                    stroke="hsl(142 70% 45%)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
