import { Scale } from "lucide-react";
import { listReconciliationOverview } from "@/features/reconciliation/actions";
import { ReconciliationOverview } from "@/features/reconciliation/components/reconciliation-overview";
import { Header, PageContainer } from "@/shared/components/layout";

export default async function ConciliacaoPage() {
  const rows = await listReconciliationOverview();

  return (
    <>
      <Header
        title="Conciliação"
        icon={<Scale className="size-5 text-primary" />}
      />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Conferência de saldos
            </h2>
            <p className="text-muted-foreground">
              Compare o saldo calculado pelo sistema com o saldo real informado
              nas instituições.
            </p>
          </div>
          <ReconciliationOverview rows={rows} />
        </div>
      </PageContainer>
    </>
  );
}