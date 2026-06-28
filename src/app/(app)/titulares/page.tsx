import { Users } from "lucide-react";
import { PlaceholderPage } from "@/shared/components/layout/placeholder-page";

export default function TitularesPage() {
  return (
    <PlaceholderPage
      title="Titulares"
      icon={<Users className="size-5 text-primary" />}
      description="Cadastro de titulares (pessoas vinculadas às contas da operação)."
    />
  );
}