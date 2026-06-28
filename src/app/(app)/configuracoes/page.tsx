import Link from "next/link";
import { Coins, Settings } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header, PageContainer } from "@/shared/components/layout";

export default function ConfiguracoesPage() {
  return (
    <>
      <Header
        title="Configurações"
        icon={<Settings className="size-5 text-primary" />}
      />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Configurações
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/configuracoes/moedas">
              <Card className="glass-card border-border/50 transition-colors hover:border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Coins className="size-5 text-primary" />
                    Moedas e cotações
                  </CardTitle>
                  <CardDescription>
                    Gerencie moedas e cotações manuais para conversão em BRL.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </PageContainer>
    </>
  );
}