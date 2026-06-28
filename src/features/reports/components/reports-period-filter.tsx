"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ReportsPeriodFilterProps {
  from: string;
  to: string;
}

export function ReportsPeriodFilter({ from, to }: ReportsPeriodFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParam(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`/relatorios?${params.toString()}`);
    });
  }

  return (
    <div
      className={`grid gap-4 sm:grid-cols-2 lg:max-w-md ${isPending ? "opacity-60" : ""}`}
    >
      <div className="space-y-2">
        <Label>De</Label>
        <Input
          type="date"
          value={from}
          onChange={(e) => updateParam("from", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Até</Label>
        <Input
          type="date"
          value={to}
          onChange={(e) => updateParam("to", e.target.value)}
        />
      </div>
    </div>
  );
}