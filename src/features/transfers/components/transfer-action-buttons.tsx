import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TransferKind } from "@/shared/lib/domain/transfer-labels";

const actions: Array<{
  kind: TransferKind;
  label: string;
  href: string;
  icon: typeof ArrowLeftRight;
  variant?: "default" | "outline";
}> = [
  {
    kind: "transfer",
    label: "Transferência",
    href: "/transferencias/nova?kind=transfer",
    icon: ArrowLeftRight,
  },
  {
    kind: "deposit",
    label: "Depósito",
    href: "/transferencias/nova?kind=deposit",
    icon: ArrowDownToLine,
    variant: "outline",
  },
  {
    kind: "withdrawal",
    label: "Saque",
    href: "/transferencias/nova?kind=withdrawal",
    icon: ArrowUpFromLine,
    variant: "outline",
  },
  {
    kind: "trader",
    label: "Trader",
    href: "/transferencias/nova?kind=trader",
    icon: Repeat,
    variant: "outline",
  },
];

export function TransferActionButtons() {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.kind} href={action.href}>
            <Button size="sm" variant={action.variant ?? "default"}>
              <Icon className="size-4" />
              {action.label}
            </Button>
          </Link>
        );
      })}
    </div>
  );
}