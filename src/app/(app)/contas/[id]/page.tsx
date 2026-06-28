import { notFound } from "next/navigation";
import { Wallet } from "lucide-react";
import { getAccount } from "@/features/accounts/actions";
import { AccountDetail } from "@/features/accounts/components/account-detail";
import { listCurrencies } from "@/features/currencies/actions";
import { listHolders } from "@/features/holders/actions";
import { Header, PageContainer } from "@/shared/components/layout";

interface ContaDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContaDetailPage({ params }: ContaDetailPageProps) {
  const { id } = await params;

  try {
    const account = await getAccount(id);
    const [allHolders, currencies] = await Promise.all([
      listHolders(),
      listCurrencies(),
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
            currencies={currencies}
          />
        </PageContainer>
      </>
    );
  } catch {
    notFound();
  }
}