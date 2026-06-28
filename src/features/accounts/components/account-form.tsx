"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createAccount, updateAccount } from "@/features/accounts/actions";
import {
  createAccountSchema,
  type CreateAccountInput,
} from "@/features/accounts/schemas";
import {
  accountStatusLabels,
  accountTypeLabels,
} from "@/shared/constants/labels";
import type {
  AccountType,
  AccountWithDetails,
  Bank,
  BettingHouse,
  CryptoBroker,
  Currency,
  Holder,
} from "@/shared/types/database";

interface AccountFormProps {
  holders: Holder[];
  banks: Bank[];
  cryptoBrokers: CryptoBroker[];
  bettingHouses: BettingHouse[];
  currencies: Currency[];
  account?: AccountWithDetails;
  defaultType?: AccountType;
}

export function AccountForm({
  holders,
  banks,
  cryptoBrokers,
  bettingHouses,
  currencies,
  account,
  defaultType = "bank",
}: AccountFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(account);

  const brlCurrency = currencies.find((c) => c.code === "BRL");

  const defaultBalances = useMemo(() => {
    if (account?.balances?.length) {
      return account.balances.map((b) => ({
        currency_id: b.currency_id,
        initial_balance: b.initial_balance,
      }));
    }
    return [
      {
        currency_id: brlCurrency?.id ?? currencies[0]?.id ?? "",
        initial_balance: 0,
      },
    ];
  }, [account, brlCurrency, currencies]);

  const resolvedBankId =
    account?.bank_id ??
    banks.find((b) => b.name === account?.institution)?.id ??
    "";

  const resolvedBrokerId =
    account?.crypto_broker_id ??
    cryptoBrokers.find((b) => b.name === account?.institution)?.id ??
    "";

  const resolvedBettingHouseId =
    account?.betting_house_id ??
    bettingHouses.find((h) => h.name === account?.institution)?.id ??
    "";

  const form = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      holder_id: account?.holder_id ?? "",
      name: account?.name ?? "",
      type: account?.type ?? defaultType,
      institution: account?.institution ?? "",
      bank_id: resolvedBankId,
      crypto_broker_id: resolvedBrokerId,
      betting_house_id: resolvedBettingHouseId,
      default_currency_id:
        account?.default_currency_id ?? brlCurrency?.id ?? "",
      initial_balance_date:
        account?.initial_balance_date ?? new Date().toISOString().slice(0, 10),
      status: account?.status ?? "active",
      masked_identifier: account?.masked_identifier ?? "",
      notes: account?.notes ?? "",
      preferred_network: account?.preferred_network ?? "",
      deposit_methods: account?.deposit_methods ?? "",
      withdrawal_methods: account?.withdrawal_methods ?? "",
      pending_balance: account?.pending_balance ?? 0,
      currency_balances: defaultBalances,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "currency_balances",
  });

  const accountType = form.watch("type");
  const holderId = form.watch("holder_id");
  const bankId = form.watch("bank_id");
  const brokerId = form.watch("crypto_broker_id");
  const bettingHouseId = form.watch("betting_house_id");
  const isCrypto = accountType === "crypto";
  const isBetting = accountType === "betting";
  const isBank = accountType === "bank";
  const supportsMultiCurrency = isCrypto || isBetting;

  useEffect(() => {
    if (isEditing) return;

    const holder = holders.find((h) => h.id === holderId);
    if (!holder) return;

    if (isBank && bankId) {
      const bank = banks.find((b) => b.id === bankId);
      if (bank) form.setValue("name", `${bank.name} · ${holder.name}`);
    }

    if (isCrypto && brokerId) {
      const broker = cryptoBrokers.find((b) => b.id === brokerId);
      if (broker) form.setValue("name", `${broker.name} · ${holder.name}`);
    }

    if (isBetting && bettingHouseId) {
      const house = bettingHouses.find((h) => h.id === bettingHouseId);
      if (house) form.setValue("name", `${house.name} · ${holder.name}`);
    }
  }, [
    holderId,
    bankId,
    brokerId,
    bettingHouseId,
    isBank,
    isCrypto,
    isBetting,
    isEditing,
    holders,
    banks,
    cryptoBrokers,
    bettingHouses,
    form,
  ]);

  async function onSubmit(values: CreateAccountInput) {
    setLoading(true);
    try {
      if (isEditing && account) {
        await updateAccount({ ...values, id: account.id });
        toast.success("Conta atualizada");
        router.push(`/contas/${account.id}`);
      } else {
        const created = await createAccount(values);
        toast.success("Conta criada");
        router.push(`/contas/${created.id}`);
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  function handleTypeChange(type: AccountType) {
    form.setValue("type", type);
    form.setValue("bank_id", undefined);
    form.setValue("crypto_broker_id", undefined);
    form.setValue("betting_house_id", undefined);
    form.setValue("institution", "");
    if (type !== "crypto" && type !== "betting") {
      const currencyId = brlCurrency?.id ?? currencies[0]?.id ?? "";
      form.setValue("currency_balances", [
        { currency_id: currencyId, initial_balance: 0 },
      ]);
      form.setValue("default_currency_id", currencyId);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-6">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>Dados gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de conta</Label>
            <Select
              value={accountType}
              onValueChange={(v) => v && handleTypeChange(v as AccountType)}
              disabled={isEditing}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(accountTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Titular</Label>
            <Select
              value={form.watch("holder_id")}
              onValueChange={(v) => v && form.setValue("holder_id", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o titular" />
              </SelectTrigger>
              <SelectContent>
                {holders.map((holder) => (
                  <SelectItem key={holder.id} value={holder.id}>
                    {holder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.holder_id && (
              <p className="text-sm text-destructive">
                {form.formState.errors.holder_id.message}
              </p>
            )}
          </div>

          {isBank && (
            <div className="space-y-2">
              <Label>Banco</Label>
              <Select
                value={form.watch("bank_id") ?? ""}
                onValueChange={(v) => v && form.setValue("bank_id", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {banks.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  <Link href="/bancos" className="text-primary hover:underline">
                    Cadastre um banco
                  </Link>{" "}
                  antes de criar a conta.
                </p>
              )}
              {form.formState.errors.bank_id && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.bank_id.message}
                </p>
              )}
            </div>
          )}

          {isCrypto && (
            <div className="space-y-2">
              <Label>Corretora / carteira</Label>
              <Select
                value={form.watch("crypto_broker_id") ?? ""}
                onValueChange={(v) => v && form.setValue("crypto_broker_id", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a corretora" />
                </SelectTrigger>
                <SelectContent>
                  {cryptoBrokers.map((broker) => (
                    <SelectItem key={broker.id} value={broker.id}>
                      {broker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cryptoBrokers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  <Link href="/corretoras" className="text-primary hover:underline">
                    Cadastre uma corretora
                  </Link>{" "}
                  antes de criar a conta.
                </p>
              )}
              {form.formState.errors.crypto_broker_id && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.crypto_broker_id.message}
                </p>
              )}
            </div>
          )}

          {isBetting && (
            <div className="space-y-2">
              <Label>Casa de apostas</Label>
              <Select
                value={form.watch("betting_house_id") ?? ""}
                onValueChange={(v) => v && form.setValue("betting_house_id", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a casa de apostas" />
                </SelectTrigger>
                <SelectContent>
                  {bettingHouses.map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      {house.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {bettingHouses.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  <Link
                    href="/casas-apostas"
                    className="text-primary hover:underline"
                  >
                    Cadastre uma casa de apostas
                  </Link>{" "}
                  antes de criar a conta.
                </p>
              )}
              {form.formState.errors.betting_house_id && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.betting_house_id.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome da conta</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Gerado automaticamente ao selecionar titular e instituição"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="masked_identifier">Identificação mascarada</Label>
            <Input
              id="masked_identifier"
              {...form.register("masked_identifier")}
              placeholder="Ex.: usuário, ag/conta parcial"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="initial_balance_date">Data do saldo inicial</Label>
              <Input
                id="initial_balance_date"
                type="date"
                {...form.register("initial_balance_date")}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) =>
                  v &&
                  form.setValue("status", v as CreateAccountInput["status"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(accountStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Saldos iniciais</CardTitle>
          {supportsMultiCurrency && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  currency_id:
                    currencies.find((c) => c.code === "USDT")?.id ??
                    currencies[0].id,
                  initial_balance: 0,
                })
              }
            >
              <Plus className="size-4" />
              Moeda
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label>Moeda</Label>
                <Select
                  value={form.watch(`currency_balances.${index}.currency_id`)}
                  onValueChange={(v) => {
                    if (!v) return;
                    form.setValue(`currency_balances.${index}.currency_id`, v);
                    if (index === 0) form.setValue("default_currency_id", v);
                  }}
                  disabled={!supportsMultiCurrency}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        {currency.code} — {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <Label>Saldo inicial</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  {...form.register(`currency_balances.${index}.initial_balance`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
              {supportsMultiCurrency && fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-7 shrink-0"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {(isCrypto || isBetting) && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Detalhes adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isCrypto && (
              <div className="space-y-2">
                <Label htmlFor="preferred_network">Rede preferencial</Label>
                <Input
                  id="preferred_network"
                  {...form.register("preferred_network")}
                  placeholder="Ex.: TRC20, ERC20"
                />
              </div>
            )}
            {isBetting && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="deposit_methods">Formas de depósito</Label>
                  <Input
                    id="deposit_methods"
                    {...form.register("deposit_methods")}
                    placeholder="Ex.: Pix, USDT"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdrawal_methods">Formas de saque</Label>
                  <Input
                    id="withdrawal_methods"
                    {...form.register("withdrawal_methods")}
                    placeholder="Ex.: Pix, TED"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pending_balance">Saldo pendente</Label>
                  <Input
                    id="pending_balance"
                    type="number"
                    step="any"
                    min="0"
                    {...form.register("pending_balance", { valueAsNumber: true })}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="glass-card border-border/50">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" rows={3} {...form.register("notes")} />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="shadow-gold">
              {loading ? "Salvando…" : isEditing ? "Salvar alterações" : "Criar conta"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}