import { LayoutDashboard } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { Header, PageContainer } from "@/shared/components/layout";

export default function DashboardPage() {
  return (
    <>
      <Header
        title="Dashboard"
        icon={<LayoutDashboard className="size-5 text-primary" />}
        rightAction={<LogoutButton />}
      />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Visão geral
            </h2>
            <p className="text-muted-foreground">
              Resumo consolidado da operação — em breve na Sprint 4.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Patrimônio", value: "—" },
              { label: "Capital aportado", value: "—" },
              { label: "Resultado", value: "—" },
            ].map((kpi) => (
              <Card key={kpi.label} className="gradient-card border-border/50">
                <CardHeader className="pb-2">
                  <CardDescription>{kpi.label}</CardDescription>
                  <CardTitle className="font-display text-3xl text-gradient-gold">
                    {kpi.value}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Cadastre titulares e contas na Sprint 1
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    </>
  );
}