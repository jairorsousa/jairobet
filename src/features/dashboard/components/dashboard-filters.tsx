"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DashboardPeriod } from "@/features/dashboard/lib/compute-dashboard";
import type { HolderWithStats } from "@/shared/types/database";

const periodOptions: { value: DashboardPeriod; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "month", label: "Mês atual" },
  { value: "year", label: "Ano atual" },
];

interface DashboardFiltersProps {
  holders: HolderWithStats[];
  holderId: string;
  period: DashboardPeriod;
}

export function DashboardFilters({
  holders,
  holderId,
  period,
}: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" && key === "holder") {
      params.delete("holder");
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-end ${isPending ? "opacity-60" : ""}`}
    >
      <div className="space-y-2 sm:min-w-56">
        <Label>Titular</Label>
        <Select
          value={holderId}
          onValueChange={(v) => v && updateParams("holder", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Consolidado (todos)</SelectItem>
            {holders.map((holder) => (
              <SelectItem key={holder.id} value={holder.id}>
                {holder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 sm:min-w-44">
        <Label>Período do gráfico</Label>
        <Select
          value={period}
          onValueChange={(v) => v && updateParams("period", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}