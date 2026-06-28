import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  accountStatusColors,
  accountStatusLabels,
  accountTypeColors,
  accountTypeLabels,
} from "@/shared/constants/labels";
import { formatMoney } from "@/shared/lib/money/format";
import { sumBalancesInBrl } from "@/shared/lib/domain/balance";
import type { AccountWithDetails } from "@/shared/types/database";
import { cn } from "@/lib/utils";

interface AccountCardProps {
  account: AccountWithDetails;
}

export function AccountCard({ account }: AccountCardProps) {
  const totalBrl = sumBalancesInBrl(account.balances);

  return (
    <Link href={`/contas/${account.id}`}>
      <Card className="glass-card border-border/50 transition-colors hover:border-primary/30">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg">{account.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{account.institution}</p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge className={cn("border-0", accountTypeColors[account.type])}>
              {accountTypeLabels[account.type]}
            </Badge>
            <Badge variant="outline">{account.holder.name}</Badge>
            <Badge className={cn("border-0", accountStatusColors[account.status])}>
              {accountStatusLabels[account.status]}
            </Badge>
          </div>
          <div className="space-y-1">
            {account.balances.map((balance) => (
              <div
                key={balance.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {balance.currency.code}
                </span>
                <span
                  className={
                    balance.calculated_balance < 0
                      ? "text-destructive font-medium"
                      : "font-medium"
                  }
                >
                  {formatMoney(
                    balance.calculated_balance,
                    balance.currency.code,
                    balance.currency.decimal_places,
                  )}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border/50 pt-2">
            <span className="text-xs text-muted-foreground">Total em BRL</span>
            <span className="font-display text-lg text-gradient-gold">
              {formatMoney(totalBrl, "BRL")}
            </span>
          </div>
          {account.type === "betting" && account.pending_balance > 0 && (
            <p className="text-xs text-warning">
              Pendente: {formatMoney(account.pending_balance, "BRL")}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}