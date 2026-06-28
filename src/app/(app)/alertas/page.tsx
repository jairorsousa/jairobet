import { Bell } from "lucide-react";
import { getAlerts } from "@/features/alerts/actions";
import { AlertsList } from "@/features/alerts/components/alerts-list";
import { Header, PageContainer } from "@/shared/components/layout";

export default async function AlertasPage() {
  const alerts = await getAlerts();

  return (
    <>
      <Header
        title="Alertas"
        icon={<Bell className="size-5 text-primary" />}
      />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              O que precisa de atenção
            </h2>
            <p className="text-muted-foreground">
              Transferências antigas, conciliações desatualizadas, saldos
              negativos e divergências.
            </p>
          </div>
          <AlertsList alerts={alerts} />
        </div>
      </PageContainer>
    </>
  );
}