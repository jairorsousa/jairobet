import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  accountTypeColors,
  accountTypeLabels,
} from "@/shared/constants/labels";
import {
  accountHasBalance,
  sumBalancesInBrl,
} from "@/shared/lib/domain/balance";
import { formatMoney } from "@/shared/lib/money/format";
import type { AccountType, AccountWithDetails } from "@/shared/types/database";
import { cn } from "@/lib/utils";

interface DashboardAccountGroupsProps {
  accounts: AccountWithDetails[];
  holderId: string;
  flaggedAccountIds?: string[];
}

const typeOrder: AccountType[] = ["bank", "crypto", "betting"];

export function DashboardAccountGroups({
  accounts,
  holderId,
  flaggedAccountIds = [],
}: DashboardAccountGroupsProps) {
  const flagged = new Set(flaggedAccountIds);
  const filtered =
    holderId === "all"
      ? accounts
      : accounts.filter((a) => a.holder_id === holderId);

  const active = filtered.filter(
    (a) => a.status !== "closed" && accountHasBalance(a),
  );

  if (active.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/50 py-12 text-center text-muted-foreground">
        Nenhuma conta com saldo
        {holderId !== "all" ? " para este titular" : ""}.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {typeOrder.map((type) => {
        const group = active.filter((a) => a.type === type);
        if (group.length === 0) return null;

        const groupTotal = group.reduce(
          (sum, a) => sum + sumBalancesInBrl(a.balances),
          0,
        );

        return (
          <section key={type} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={cn("border-0", accountTypeColors[type])}>
                  {accountTypeLabels[type]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {group.length} conta{group.length !== 1 ? "s" : ""}
                </span>
              </div>
              <span className="font-display text-lg text-gradient-gold">
                {formatMoney(groupTotal, "BRL")}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.map((account) => {
                const hasAlert = flagged.has(account.id);
                return (
                <Link key={account.id} href={`/contas/${account.id}`}>
                  <Card
                    className={cn(
                      "glass-card border-border/50 transition-colors hover:border-primary/30",
                      hasAlert && "border-destructive/40",
                    )}
                  >
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{account.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {account.institution}
                          {holderId === "all"
                            ? ` · ${account.holder.name}`
                            : ""}
                        </p>
                      </div>
                      {hasAlert ? (
                        <AlertTriangle className="size-4 text-destructive" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground" />
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="font-display text-xl text-gradient-gold">
                        {formatMoney(sumBalancesInBrl(account.balances), "BRL")}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
