import { BarChart3 } from "lucide-react";
import { PlaceholderPage } from "@/shared/components/layout/placeholder-page";

export default function MovimentacoesPage() {
  return (
    <PlaceholderPage
      title="Movimentações"
      icon={<BarChart3 className="size-5 text-primary" />}
      description="Histórico de lançamentos com filtros por titular, conta e tipo."
    />
  );
}