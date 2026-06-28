import { Scale } from "lucide-react";
import { PlaceholderPage } from "@/shared/components/layout/placeholder-page";

export default function ConciliacaoPage() {
  return (
    <PlaceholderPage
      title="Conciliação"
      icon={<Scale className="size-5 text-primary" />}
      description="Conferência de saldo calculado vs. saldo real nas instituições."
    />
  );
}