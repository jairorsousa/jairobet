import { Trophy } from "lucide-react";
import { listBettingHouses } from "@/features/betting-houses/actions";
import { BettingHousesList } from "@/features/betting-houses/components/betting-houses-list";
import { Header, PageContainer } from "@/shared/components/layout";

export default async function CasasApostasPage() {
  const houses = await listBettingHouses();

  return (
    <>
      <Header
        title="Casas de apostas"
        icon={<Trophy className="size-5 text-primary" />}
      />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Casas de apostas
            </h2>
            <p className="text-muted-foreground">
              Plataformas disponíveis ao criar contas de casa de apostas.
            </p>
          </div>
          <BettingHousesList houses={houses} />
        </div>
      </PageContainer>
    </>
  );
}