import { ArrowLeftRight } from "lucide-react";
import { PlaceholderPage } from "@/shared/components/layout/placeholder-page";

export default function TransferenciasPage() {
  return (
    <PlaceholderPage
      title="Transferências"
      icon={<ArrowLeftRight className="size-5 text-primary" />}
      description="Transferências entre contas com status pendente e confirmação de recebimento."
    />
  );
}