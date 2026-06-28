import { Settings } from "lucide-react";
import { PlaceholderPage } from "@/shared/components/layout/placeholder-page";

export default function ConfiguracoesPage() {
  return (
    <PlaceholderPage
      title="Configurações"
      icon={<Settings className="size-5 text-primary" />}
      description="Moedas, cotações manuais e preferências do sistema."
    />
  );
}