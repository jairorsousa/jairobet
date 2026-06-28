"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  accountStatusLabels,
  accountTypeLabels,
} from "@/shared/constants/labels";
import type { Holder } from "@/shared/types/database";

interface AccountsFiltersProps {
  holders: Holder[];
}

export function AccountsFilters({ holders }: AccountsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/contas?${params.toString()}`);
  }

  const withBalanceOnly = searchParams.get("with_balance") === "1";

  function toggleWithBalance(checked: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set("with_balance", "1");
    } else {
      params.delete("with_balance");
    }
    router.push(`/contas?${params.toString()}`);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select
          value={searchParams.get("type") ?? "all"}
          onValueChange={(v) => v && updateFilter("type", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(accountTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Titular</Label>
        <Select
          value={searchParams.get("holder") ?? "all"}
          onValueChange={(v) => v && updateFilter("holder", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {holders.map((holder) => (
              <SelectItem key={holder.id} value={holder.id}>
                {holder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={searchParams.get("status") ?? "all"}
          onValueChange={(v) => v && updateFilter("status", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(accountStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Saldo</Label>
        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-colors hover:bg-muted/40">
          <input
            type="checkbox"
            className="size-4 rounded border-input accent-primary"
            checked={withBalanceOnly}
            onChange={(e) => toggleWithBalance(e.target.checked)}
          />
          Apenas com saldo
        </label>
      </div>
    </div>
  );
}