import { Bitcoin } from "lucide-react";
import { listCryptoBrokers } from "@/features/crypto-brokers/actions";
import { CryptoBrokersList } from "@/features/crypto-brokers/components/crypto-brokers-list";
import { Header, PageContainer } from "@/shared/components/layout";

export default async function CorretorasPage() {
  const brokers = await listCryptoBrokers();

  return (
    <>
      <Header
        title="Corretoras"
        icon={<Bitcoin className="size-5 text-primary" />}
      />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Corretoras e carteiras
            </h2>
            <p className="text-muted-foreground">
              Plataformas de cripto disponíveis ao criar contas de corretora/carteira.
            </p>
          </div>
          <CryptoBrokersList brokers={brokers} />
        </div>
      </PageContainer>
    </>
  );
}