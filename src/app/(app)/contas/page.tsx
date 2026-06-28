import { Wallet } from "lucide-react";
import { PlaceholderPage } from "@/shared/components/layout/placeholder-page";

export default function ContasPage() {
  return (
    <PlaceholderPage
      title="Contas"
      icon={<Wallet className="size-5 text-primary" />}
      description="Contas bancárias, corretoras/carteiras de cripto e casas de apostas."
    />
  );
}