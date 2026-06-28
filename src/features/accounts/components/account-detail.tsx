"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteAccount } from "@/features/accounts/actions";
import { AccountForm } from "@/features/accounts/components/account-form";
import { MovementsList } from "@/features/movements/components/movements-list";
import { ReconciliationHistory } from "@/features/reconciliation/components/reconciliation-history";
import {
  accountStatusColors,
  accountStatusLabels,
  accountTypeColors,
  accountTypeLabels,
} from "@/shared/constants/labels";
import { sumBalancesInBrl } from "@/shared/lib/domain/balance";
import { formatMoney } from "@/shared/lib/money/format";
import type {
  AccountWithDetails,
  Bank,
  BettingHouse,
  CryptoBroker,
  Currency,
  Holder,
  MovementWithDetails,
  ReconciliationWithDetails,
} from "@/shared/types/database";
import { cn } from "@/lib/utils";

interface AccountDetailProps {
  account: AccountWithDetails;
  holders: Holder[];
  banks: Bank[];
  cryptoBrokers: CryptoBroker[];
  bettingHouses: BettingHouse[];
  currencies: Currency[];
  movements: MovementWithDetails[];
  reconciliations: ReconciliationWithDetails[];
  selectableAccounts: AccountWithDetails[];
}

export function AccountDetail({
  account,
  holders,
  banks,
  cryptoBrokers,
  bettingHouses,
  currencies,
  movements,
  reconciliations,
  selectableAccounts,
}: AccountDetailProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalBrl = sumBalancesInBrl(account.balances);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteAccount(account.id);
      toast.success("Conta excluída");
      router.push("/contas");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setLoading(false);
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setEditing(false)}>
          <ArrowLeft className="size-4" />
          Voltar à visualização
        </Button>
        <AccountForm
          account={account}
          holders={holders}
          banks={banks}
          cryptoBrokers={cryptoBrokers}
          bettingHouses={bettingHouses}
          currencies={currencies}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/contas">
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-4" />
            Voltar
          </Button>
        </Link>
        <Button size="sm" onClick={() => setEditing(true)}>
          <Pencil className="size-4" />
          Editar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleting(true)}
        >
          <Trash2 className="size-4" />
          Excluir
        </Button>
      </div>

      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="movimentacoes">
            Movimentações ({movements.length})
          </TabsTrigger>
          <TabsTrigger value="conciliacoes">
            Conciliações ({reconciliations.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="resumo" className="mt-4">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge className={cn("border-0", accountTypeColors[account.type])}>
                  {accountTypeLabels[account.type]}
                </Badge>
                <Badge variant="outline">{account.holder.name}</Badge>
                <Badge
                  className={cn("border-0", accountStatusColors[account.status])}
                >
                  {accountStatusLabels[account.status]}
                </Badge>
              </div>
              <CardTitle className="text-2xl">{account.name}</CardTitle>
              <p className="text-muted-foreground">{account.institution}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {account.masked_identifier && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Identificação: </span>
                  {account.masked_identifier}
                </p>
              )}
              <div className="rounded-lg border border-border/50 p-4">
                <p className="text-sm text-muted-foreground">Total em BRL</p>
                <p className="font-display text-3xl text-gradient-gold">
                  {formatMoney(totalBrl, "BRL")}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Saldos por moeda</p>
                {account.balances.map((balance) => (
                  <div
                    key={balance.id}
                    className="flex justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                  >
                    <span>{balance.currency.code}</span>
                    <span
                      className={
                        balance.calculated_balance < 0
                          ? "font-medium text-destructive"
                          : ""
                      }
                    >
                      {formatMoney(
                        balance.calculated_balance,
                        balance.currency.code,
                        balance.currency.decimal_places,
                      )}
                    </span>
                  </div>
                ))}
              </div>
              {account.notes && (
                <p className="text-sm text-muted-foreground">{account.notes}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="movimentacoes" className="mt-4">
          <MovementsList
            movements={movements}
            accounts={selectableAccounts}
          />
        </TabsContent>
        <TabsContent value="conciliacoes" className="mt-4">
          <ReconciliationHistory items={reconciliations} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma a exclusão de &quot;{account.name}&quot;? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={loading}
              onClick={handleDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}