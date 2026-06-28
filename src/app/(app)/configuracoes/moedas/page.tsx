import Link from "next/link";
import { ArrowLeft, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listCurrencies } from "@/features/currencies/actions";
import { CurrenciesList } from "@/features/currencies/components/currencies-list";
import { Header, PageContainer } from "@/shared/components/layout";

export default async function MoedasPage() {
  const currencies = await listCurrencies();

  return (
    <>
      <Header
        title="Moedas"
        icon={<Coins className="size-5 text-primary" />}
        rightAction={
          <Link href="/configuracoes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4" />
              Voltar
            </Button>
          </Link>
        }
      />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Moedas e cotações
            </h2>
            <p className="text-muted-foreground">
              Informe manualmente a cotação em BRL para exibir equivalentes.
            </p>
          </div>
          <CurrenciesList currencies={currencies} />
        </div>
      </PageContainer>
    </>
  );
}