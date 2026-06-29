import { notFound } from "next/navigation";
import { Wallet } from "lucide-react";
import { getAccount, listSelectableAccounts } from "@/features/accounts/actions";
import { listAccountMovements } from "@/features/movements/actions";
import { listReconciliations } from "@/features/reconciliation/actions";
import { AccountDetail } from "@/features/accounts/components/account-detail";
import { listActiveBanks } from "@/features/banks/actions";
import { listActiveBettingHouses } from "@/features/betting-houses/actions";
import { listCurrencies } from "@/features/currencies/actions";
import { listActiveCryptoBrokers } from "@/features/crypto-brokers/actions";
import { listHolders } from "@/features/holders/actions";
import { Header, PageContainer } from "@/shared/components/layout";

interface ContaDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContaDetailPage({ params }: ContaDetailPageProps) {
  const { id } = await params;

  let data: {
    account: Awaited<ReturnType<typeof getAccount>>;
    allHolders: Awaited<ReturnType<typeof listHolders>>;
    banks: Awaited<ReturnType<typeof listActiveBanks>>;
    cryptoBrokers: Awaited<ReturnType<typeof listActiveCryptoBrokers>>;
    bettingHouses: Awaited<ReturnType<typeof listActiveBettingHouses>>;
    currencies: Awaited<ReturnType<typeof listCurrencies>>;
    movements: Awaited<ReturnType<typeof listAccountMovements>>;
    reconciliations: Awaited<ReturnType<typeof listReconciliations>>;
    selectableAccounts: Awaited<ReturnType<typeof listSelectableAccounts>>;
  };

  try {
    const account = await getAccount(id);
    const [
      allHolders,
      banks,
      cryptoBrokers,
      bettingHouses,
      currencies,
      movements,
      reconciliations,
      selectableAccounts,
    ] = await Promise.all([
      listHolders(),
      listActiveBanks(),
      listActiveCryptoBrokers(),
      listActiveBettingHouses(),
      listCurrencies(),
      listAccountMovements(id),
      listReconciliations(id),
      listSelectableAccounts(),
    ]);

    data = {
      account,
      allHolders,
      banks,
      cryptoBrokers,
      bettingHouses,
      currencies,
      movements,
      reconciliations,
      selectableAccounts,
    };
  } catch {
    notFound();
  }

  const holders = data.allHolders.filter(
    (h) => h.status === "active" || h.id === data.account.holder_id,
  );

  return (
    <>
      <Header
        title={data.account.name}
        icon={<Wallet className="size-5 text-primary" />}
      />
      <PageContainer>
        <AccountDetail
          account={data.account}
          holders={holders}
          banks={data.banks}
          cryptoBrokers={data.cryptoBrokers}
          bettingHouses={data.bettingHouses}
          currencies={data.currencies}
          movements={data.movements}
          reconciliations={data.reconciliations}
          selectableAccounts={data.selectableAccounts}
        />
      </PageContainer>
    </>
  );
}
