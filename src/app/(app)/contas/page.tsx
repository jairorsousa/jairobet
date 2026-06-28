import { Suspense } from "react";
import Link from "next/link";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listAccounts } from "@/features/accounts/actions";
import { AccountCard } from "@/features/accounts/components/account-card";
import { AccountsFilters } from "@/features/accounts/components/accounts-filters";
import { listHolders } from "@/features/holders/actions";
import { Header, PageContainer } from "@/shared/components/layout";
import type { AccountStatus, AccountType } from "@/shared/types/database";

interface ContasPageProps {
  searchParams: Promise<{
    type?: string;
    holder?: string;
    status?: string;
    with_balance?: string;
  }>;
}

export default async function ContasPage({ searchParams }: ContasPageProps) {
  const params = await searchParams;
  const holders = await listHolders();

  const withBalanceOnly = params.with_balance === "1";

  const accounts = await listAccounts({
    type: (params.type as AccountType | undefined) ?? "all",
    holder_id: params.holder ?? "all",
    status: (params.status as AccountStatus | undefined) ?? "all",
    with_balance: withBalanceOnly,
  });

  return (
    <>
      <Header
        title="Contas"
        icon={<Wallet className="size-5 text-primary" />}
        rightAction={
          <Link href="/contas/nova">
            <Button size="sm">
              <Plus className="size-4" />
              Nova conta
            </Button>
          </Link>
        }
      />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight">
                Contas
              </h2>
              <p className="text-muted-foreground">
                {accounts.length} conta{accounts.length !== 1 ? "s" : ""}
                {withBalanceOnly ? " com saldo" : " cadastrada"}
                {accounts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-muted" />}>
            <AccountsFilters holders={holders} />
          </Suspense>

          {accounts.length === 0 ? (
            <div className="glass-card rounded-xl border border-border/50 p-12 text-center">
              <Wallet className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">
                {withBalanceOnly
                  ? "Nenhuma conta com saldo encontrada com os filtros selecionados."
                  : "Nenhuma conta encontrada. Cadastre um titular e crie a primeira conta."}
              </p>
              <Link href="/contas/nova">
                <Button className="mt-4">
                  <Plus className="size-4" />
                  Nova conta
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {accounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
}