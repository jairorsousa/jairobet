import Link from "next/link";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listSelectableAccounts } from "@/features/accounts/actions";
import { TransferWizard } from "@/features/transfers/components/transfer-wizard";
import { Header, PageContainer } from "@/shared/components/layout";

export default async function NovaTransferenciaPage() {
  const accounts = await listSelectableAccounts();

  return (
    <>
      <Header
        title="Nova transferência"
        icon={<ArrowLeftRight className="size-5 text-primary" />}
        rightAction={
          <Link href="/transferencias">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4" />
              Voltar
            </Button>
          </Link>
        }
      />
      <PageContainer>
        {accounts.length < 2 ? (
          <div className="glass-card rounded-xl border border-border/50 p-8 text-center">
            <p className="text-muted-foreground">
              Cadastre ao menos duas contas ativas para transferir entre elas.
            </p>
            <Link href="/contas/nova">
              <Button className="mt-4">Criar conta</Button>
            </Link>
          </div>
        ) : (
          <TransferWizard accounts={accounts} />
        )}
      </PageContainer>
    </>
  );
}