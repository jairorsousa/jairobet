import { BarChart3 } from "lucide-react";
import { PlaceholderPage } from "@/shared/components/layout/placeholder-page";

export default function RelatoriosPage() {
  return (
    <PlaceholderPage
      title="Relatórios"
      icon={<BarChart3 className="size-5 text-primary" />}
      description="Resultado por período, titular e casa de apostas com exportação CSV."
    />
  );
}