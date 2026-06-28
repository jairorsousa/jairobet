import { notFound } from "next/navigation";
import { Wallet } from "lucide-react";
import { getAccount, listSelectableAccounts } from "@/features/accounts/actions";
import { listAccountMovements } from "@/features/movements/actions";
import { listReconciliations } from "@/features/reconciliation/actions";
import { AccountDetail } from "@/features/accounts/components/account-detail";
import { listActiveBanks } from "@/features/banks/actions";
import { listCurrencies } from "@/features/currencies/actions";
import { listActiveCryptoBrokers } from "@/features/crypto-brokers/actions";
import { listHolders } from "@/features/holders/actions";
import { Header, PageContainer } from "@/shared/components/layout";

interface ContaDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContaDetailPage({ params }: ContaDetailPageProps) {
  const { id } = await params;

  try {
    const account = await getAccount(id);
    const [
      allHolders,
      banks,
      cryptoBrokers,
      currencies,
      movements,
      reconciliations,
      selectableAccounts,
    ] = await Promise.all([
      listHolders(),
      listActiveBanks(),
      listActiveCryptoBrokers(),
      listCurrencies(),
      listAccountMovements(id),
      listReconciliations(id),
      listSelectableAccounts(),
    ]);
    const holders = allHolders.filter(
      (h) => h.status === "active" || h.id === account.holder_id,
    );

    return (
      <>
        <Header
          title={account.name}
          icon={<Wallet className="size-5 text-primary" />}
        />
        <PageContainer>
          <AccountDetail
            account={account}
            holders={holders}
            banks={banks}
            cryptoBrokers={cryptoBrokers}
            currencies={currencies}
            movements={movements}
            reconciliations={reconciliations}
            selectableAccounts={selectableAccounts}
          />
        </PageContainer>
      </>
    );
  } catch {
    notFound();
  }
}