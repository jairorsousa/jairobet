import { Users } from "lucide-react";
import { listHolders } from "@/features/holders/actions";
import { HoldersList } from "@/features/holders/components/holders-list";
import { Header, PageContainer } from "@/shared/components/layout";

export default async function TitularesPage() {
  const holders = await listHolders();

  return (
    <>
      <Header
        title="Titulares"
        icon={<Users className="size-5 text-primary" />}
      />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Titulares da operação
            </h2>
            <p className="text-muted-foreground">
              Pessoas vinculadas às contas bancárias, de cripto e casas de apostas.
            </p>
          </div>
          <HoldersList holders={holders} />
        </div>
      </PageContainer>
    </>
  );
}