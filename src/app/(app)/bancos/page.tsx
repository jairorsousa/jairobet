import { Landmark } from "lucide-react";
import { listBanks } from "@/features/banks/actions";
import { BanksList } from "@/features/banks/components/banks-list";
import { Header, PageContainer } from "@/shared/components/layout";

export default async function BancosPage() {
  const banks = await listBanks();

  return (
    <>
      <Header
        title="Bancos"
        icon={<Landmark className="size-5 text-primary" />}
      />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Bancos e fintechs
            </h2>
            <p className="text-muted-foreground">
              Instituições disponíveis ao criar contas bancárias.
            </p>
          </div>
          <BanksList banks={banks} />
        </div>
      </PageContainer>
    </>
  );
}