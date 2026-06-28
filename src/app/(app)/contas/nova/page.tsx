import Link from "next/link";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listCurrencies } from "@/features/currencies/actions";
import { AccountForm } from "@/features/accounts/components/account-form";
import { listActiveHolders } from "@/features/holders/actions";
import { Header, PageContainer } from "@/shared/components/layout";
import type { AccountType } from "@/shared/types/database";

interface NovaContaPageProps {
  searchParams: Promise<{ tipo?: string }>;
}

export default async function NovaContaPage({ searchParams }: NovaContaPageProps) {
  const params = await searchParams;
  const [holders, currencies] = await Promise.all([
    listActiveHolders(),
    listCurrencies(),
  ]);

  const defaultType = (["bank", "crypto", "betting"].includes(params.tipo ?? "")
    ? params.tipo
    : "bank") as AccountType;

  return (
    <>
      <Header
        title="Nova conta"
        icon={<Plus className="size-5 text-primary" />}
      />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          {holders.length === 0 ? (
            <div className="glass-card rounded-xl border border-border/50 p-8 text-center">
              <p className="text-muted-foreground">
                Cadastre ao menos um titular antes de criar uma conta.
              </p>
              <Link href="/titulares">
                <Button className="mt-4">Ir para titulares</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["bank", "Banco"],
                    ["crypto", "Cripto"],
                    ["betting", "Casa de apostas"],
                  ] as const
                ).map(([tipo, label]) => (
                  <Link key={tipo} href={`/contas/nova?tipo=${tipo}`}>
                    <Button
                      variant={defaultType === tipo ? "default" : "outline"}
                      size="sm"
                    >
                      {label}
                    </Button>
                  </Link>
                ))}
              </div>
              <AccountForm
                holders={holders}
                currencies={currencies}
                defaultType={defaultType}
              />
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}