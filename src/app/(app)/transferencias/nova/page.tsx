import Link from "next/link";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listSelectableAccounts } from "@/features/accounts/actions";
import { TransferWizard } from "@/features/transfers/components/transfer-wizard";
import { Header, PageContainer } from "@/shared/components/layout";
import {
  transferKindLabels,
  type TransferKind,
} from "@/shared/lib/domain/transfer-labels";

interface NovaTransferenciaPageProps {
  searchParams: Promise<{ kind?: string }>;
}

const validKinds = new Set<TransferKind>([
  "transfer",
  "deposit",
  "withdrawal",
  "trader",
]);

function resolveInitialKind(kind?: string): TransferKind {
  if (kind && validKinds.has(kind as TransferKind)) {
    return kind as TransferKind;
  }
  return "transfer";
}

export default async function NovaTransferenciaPage({
  searchParams,
}: NovaTransferenciaPageProps) {
  const params = await searchParams;
  const initialKind = resolveInitialKind(params.kind);
  const lockKind = Boolean(params.kind && validKinds.has(params.kind as TransferKind));
  const accounts = await listSelectableAccounts();
  const canCreate =
    initialKind === "trader"
      ? accounts.length >= 1
      : accounts.length >= 2;

  return (
    <>
      <Header
        title={`Nova ${transferKindLabels[initialKind].toLowerCase()}`}
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
        {!canCreate ? (
          <div className="glass-card rounded-xl border border-border/50 p-8 text-center">
            <p className="text-muted-foreground">
              {initialKind === "trader"
                ? "Cadastre ao menos uma conta ativa para registrar um trade."
                : "Cadastre ao menos duas contas ativas para transferir entre elas."}
            </p>
            <Link href="/contas/nova">
              <Button className="mt-4">Criar conta</Button>
            </Link>
          </div>
        ) : (
          <TransferWizard
            accounts={accounts}
            initialKind={initialKind}
            lockKind={lockKind}
          />
        )}
      </PageContainer>
    </>
  );
}