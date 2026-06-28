import Link from "next/link";
import { ArrowLeftRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listPendingTransfers } from "@/features/movements/actions";
import { TransfersList } from "@/features/transfers/components/transfers-list";
import { Header, PageContainer } from "@/shared/components/layout";

export default async function TransferenciasPage() {
  const transfers = await listPendingTransfers();

  return (
    <>
      <Header
        title="Transferências"
        icon={<ArrowLeftRight className="size-5 text-primary" />}
        rightAction={
          <Link href="/transferencias/nova">
            <Button size="sm">
              <Plus className="size-4" />
              Nova
            </Button>
          </Link>
        }
      />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Pendentes
            </h2>
            <p className="text-muted-foreground">
              Valores em trânsito aguardando confirmação de recebimento.
            </p>
          </div>
          <TransfersList transfers={transfers} />
        </div>
      </PageContainer>
    </>
  );
}