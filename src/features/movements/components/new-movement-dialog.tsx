"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  createBalanceAdjustment,
  createBetLost,
  createBetWon,
  createBonus,
  createCapitalDeposit,
  createCapitalWithdrawal,
  createCashback,
  createConversion,
  createFee,
  createRakeback,
  hasDuplicateExternalId,
} from "@/features/movements/actions";
import {
  createBalanceAdjustmentSchema,
  createBetResultSchema,
  createBonusSchema,
  createCapitalDepositSchema,
  createCashbackSchema,
  createConversionSchema,
  createFeeSchema,
  createRakebackSchema,
} from "@/features/movements/schemas";
import { newMovementOptions } from "@/shared/lib/domain/movement-labels";
import type { AccountWithDetails } from "@/shared/types/database";
import type { MovementType } from "@/shared/types/database";
import { z } from "zod";

type FormType = MovementType | "capital_deposit" | "capital_withdrawal";

interface AccountCurrencySelectProps {
  accounts: AccountWithDetails[];
  accountId: string;
  currencyId: string;
  onAccountChange: (accountId: string, defaultCurrencyId: string) => void;
  onCurrencyChange: (currencyId: string) => void;
  accountFilter?: (account: AccountWithDetails) => boolean;
}

function AccountCurrencySelect({
  accounts,
  accountId,
  currencyId,
  onAccountChange,
  onCurrencyChange,
  accountFilter,
}: AccountCurrencySelectProps) {
  const filtered = accountFilter ? accounts.filter(accountFilter) : accounts;
  const selected = accounts.find((a) => a.id === accountId);

  return (
    <>
      <div className="space-y-2">
        <Label>Conta</Label>
        <Select
          value={accountId}
          onValueChange={(v) => {
            if (!v) return;
            const acc = accounts.find((a) => a.id === v);
            onAccountChange(v, acc?.default_currency_id ?? currencyId);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {filtered.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name} ({account.holder.name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Moeda</Label>
        <Select
          value={currencyId}
          onValueChange={(v) => v && onCurrencyChange(v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {selected?.balances.map((b) => (
              <SelectItem key={b.currency_id} value={b.currency_id}>
                {b.currency.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

interface NewMovementDialogProps {
  accounts: AccountWithDetails[];
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function NewMovementDialog({
  accounts,
  onSuccess,
  trigger,
}: NewMovementDialogProps) {
  const [open, setOpen] = useState(false);
  const [formType, setFormType] = useState<FormType>("capital_deposit");
  const [loading, setLoading] = useState(false);

  const bettingAccounts = useMemo(
    () => accounts.filter((a) => a.type === "betting"),
    [accounts],
  );
  const cryptoAccounts = useMemo(
    () => accounts.filter((a) => a.type === "crypto"),
    [accounts],
  );

  const capitalForm = useForm({
    resolver: zodResolver(createCapitalDepositSchema),
    defaultValues: {
      account_id: "",
      currency_id: "",
      amount: 0,
      occurred_at: new Date().toISOString().slice(0, 10),
      description: "",
    },
  });

  const feeForm = useForm({
    resolver: zodResolver(createFeeSchema),
    defaultValues: {
      account_id: "",
      currency_id: "",
      amount: 0,
      occurred_at: new Date().toISOString().slice(0, 10),
      description: "",
      external_id: "",
    },
  });

  const cashbackForm = useForm({
    resolver: zodResolver(createCashbackSchema),
    defaultValues: {
      account_id: "",
      currency_id: "",
      amount: 0,
      occurred_at: new Date().toISOString().slice(0, 10),
      status: "pendente" as const,
      description: "",
      external_id: "",
    },
  });

  const rakebackForm = useForm({
    resolver: zodResolver(createRakebackSchema),
    defaultValues: {
      account_id: "",
      currency_id: "",
      amount: 0,
      occurred_at: new Date().toISOString().slice(0, 10),
      status: "pendente" as const,
      description: "",
      external_id: "",
    },
  });

  const betForm = useForm({
    resolver: zodResolver(createBetResultSchema),
    defaultValues: {
      account_id: "",
      currency_id: "",
      amount: 0,
      occurred_at: new Date().toISOString().slice(0, 10),
      description: "",
      external_id: "",
    },
  });

  const bonusForm = useForm({
    resolver: zodResolver(createBonusSchema),
    defaultValues: {
      account_id: "",
      currency_id: "",
      amount: 0,
      occurred_at: new Date().toISOString().slice(0, 10),
      status: "pendente" as const,
      withdrawable: false,
      bonus_type: "",
      valid_until: "",
      description: "",
      external_id: "",
    },
  });

  const conversionForm = useForm({
    resolver: zodResolver(createConversionSchema),
    defaultValues: {
      account_id: "",
      from_currency_id: "",
      to_currency_id: "",
      from_amount: 0,
      to_amount: 0,
      exchange_rate: 1,
      fee_amount: 0,
      occurred_at: new Date().toISOString().slice(0, 10),
      description: "",
    },
  });
  const conversionAccountId = useWatch({
    control: conversionForm.control,
    name: "account_id",
  });
  const conversionFromCurrencyId = useWatch({
    control: conversionForm.control,
    name: "from_currency_id",
  });
  const conversionToCurrencyId = useWatch({
    control: conversionForm.control,
    name: "to_currency_id",
  });

  const adjustmentForm = useForm({
    resolver: zodResolver(createBalanceAdjustmentSchema),
    defaultValues: {
      account_id: "",
      currency_id: "",
      direction: "credit" as const,
      amount: 0,
      reason: "",
      occurred_at: new Date().toISOString().slice(0, 10),
    },
  });

  const capitalAccountId = useWatch({
    control: capitalForm.control,
    name: "account_id",
  });
  const capitalCurrencyId = useWatch({
    control: capitalForm.control,
    name: "currency_id",
  });
  const feeAccountId = useWatch({
    control: feeForm.control,
    name: "account_id",
  });
  const feeCurrencyId = useWatch({
    control: feeForm.control,
    name: "currency_id",
  });
  const cashbackAccountId = useWatch({
    control: cashbackForm.control,
    name: "account_id",
  });
  const cashbackCurrencyId = useWatch({
    control: cashbackForm.control,
    name: "currency_id",
  });
  const cashbackStatus = useWatch({
    control: cashbackForm.control,
    name: "status",
  });
  const rakebackAccountId = useWatch({
    control: rakebackForm.control,
    name: "account_id",
  });
  const rakebackCurrencyId = useWatch({
    control: rakebackForm.control,
    name: "currency_id",
  });
  const rakebackStatus = useWatch({
    control: rakebackForm.control,
    name: "status",
  });
  const betAccountId = useWatch({
    control: betForm.control,
    name: "account_id",
  });
  const betCurrencyId = useWatch({
    control: betForm.control,
    name: "currency_id",
  });
  const bonusAccountId = useWatch({
    control: bonusForm.control,
    name: "account_id",
  });
  const bonusCurrencyId = useWatch({
    control: bonusForm.control,
    name: "currency_id",
  });
  const bonusStatus = useWatch({
    control: bonusForm.control,
    name: "status",
  });
  const bonusWithdrawable = useWatch({
    control: bonusForm.control,
    name: "withdrawable",
  });
  const adjustmentAccountId = useWatch({
    control: adjustmentForm.control,
    name: "account_id",
  });
  const adjustmentCurrencyId = useWatch({
    control: adjustmentForm.control,
    name: "currency_id",
  });
  const adjustmentDirection = useWatch({
    control: adjustmentForm.control,
    name: "direction",
  });

  useEffect(() => {
    if (!open || accounts.length === 0) return;
    const first = accounts[0];
    capitalForm.reset({
      account_id: first.id,
      currency_id: first.default_currency_id,
      amount: 0,
      occurred_at: new Date().toISOString().slice(0, 10),
      description: "",
    });
  }, [open, accounts, capitalForm]);

  async function warnDuplicate(externalId?: string) {
    if (!externalId?.trim()) return;
    const dup = await hasDuplicateExternalId(externalId);
    if (dup) {
      toast.warning("Já existe lançamento com este identificador");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      switch (formType) {
        case "capital_deposit": {
          const values = createCapitalDepositSchema.parse(capitalForm.getValues());
          await createCapitalDeposit(values);
          toast.success("Aporte registrado");
          break;
        }
        case "capital_withdrawal": {
          const values = createCapitalDepositSchema.parse(capitalForm.getValues());
          await createCapitalWithdrawal(values);
          toast.success("Retirada registrada");
          break;
        }
        case "fee": {
          const values = createFeeSchema.parse(feeForm.getValues());
          await warnDuplicate(values.external_id);
          await createFee(values);
          toast.success("Taxa registrada");
          break;
        }
        case "cashback": {
          const values = createCashbackSchema.parse(cashbackForm.getValues());
          await warnDuplicate(values.external_id);
          await createCashback(values);
          toast.success("Cashback registrado");
          break;
        }
        case "rakeback": {
          const values = createRakebackSchema.parse(rakebackForm.getValues());
          await warnDuplicate(values.external_id);
          await createRakeback(values);
          toast.success("Rakeback registrado");
          break;
        }
        case "bet_won": {
          const values = createBetResultSchema.parse(betForm.getValues());
          await warnDuplicate(values.external_id);
          await createBetWon(values);
          toast.success("Aposta ganha registrada");
          break;
        }
        case "bet_lost": {
          const values = createBetResultSchema.parse(betForm.getValues());
          await warnDuplicate(values.external_id);
          await createBetLost(values);
          toast.success("Aposta perdida registrada");
          break;
        }
        case "bonus": {
          const values = createBonusSchema.parse(bonusForm.getValues());
          await warnDuplicate(values.external_id);
          await createBonus(values);
          toast.success("Bônus registrado");
          break;
        }
        case "conversion": {
          const values = createConversionSchema.parse(conversionForm.getValues());
          await createConversion(values);
          toast.success("Conversão registrada");
          break;
        }
        case "balance_adjustment": {
          const values = createBalanceAdjustmentSchema.parse(
            adjustmentForm.getValues(),
          );
          await createBalanceAdjustment(values);
          toast.success("Ajuste registrado");
          break;
        }
        default:
          break;
      }
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.issues[0]?.message ?? "Dados inválidos");
      } else {
        toast.error(err instanceof Error ? err.message : "Erro ao salvar");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger ?? (
          <Button>
            <Plus className="size-4" />
            Novo lançamento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
          <DialogDescription>
            Selecione o tipo e preencha os dados manualmente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={formType}
              onValueChange={(v) => v && setFormType(v as FormType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {newMovementOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(formType === "capital_deposit" || formType === "capital_withdrawal") && (
            <>
              <AccountCurrencySelect
                accounts={accounts}
                accountId={capitalAccountId}
                currencyId={capitalCurrencyId}
                onAccountChange={(accountId, defaultCurrencyId) => {
                  capitalForm.setValue("account_id", accountId);
                  capitalForm.setValue("currency_id", defaultCurrencyId);
                }}
                onCurrencyChange={(currencyId) =>
                  capitalForm.setValue("currency_id", currencyId)
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="any"
                    {...capitalForm.register("amount", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" {...capitalForm.register("occurred_at")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea rows={2} {...capitalForm.register("description")} />
              </div>
            </>
          )}

          {formType === "fee" && (
            <>
              <AccountCurrencySelect
                accounts={accounts}
                accountId={feeAccountId}
                currencyId={feeCurrencyId}
                onAccountChange={(accountId, defaultCurrencyId) => {
                  feeForm.setValue("account_id", accountId);
                  feeForm.setValue("currency_id", defaultCurrencyId);
                }}
                onCurrencyChange={(currencyId) =>
                  feeForm.setValue("currency_id", currencyId)
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="any"
                    {...feeForm.register("amount", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" {...feeForm.register("occurred_at")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>ID transação (opcional)</Label>
                <Input {...feeForm.register("external_id")} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea rows={2} {...feeForm.register("description")} />
              </div>
            </>
          )}

          {formType === "cashback" && (
            <>
              <AccountCurrencySelect
                accounts={accounts}
                accountId={cashbackAccountId}
                currencyId={cashbackCurrencyId}
                onAccountChange={(accountId, defaultCurrencyId) => {
                  cashbackForm.setValue("account_id", accountId);
                  cashbackForm.setValue("currency_id", defaultCurrencyId);
                }}
                onCurrencyChange={(currencyId) =>
                  cashbackForm.setValue("currency_id", currencyId)
                }
                accountFilter={(a) => a.type === "betting"}
              />
              {bettingAccounts.length === 0 && (
                <p className="text-sm text-warning">
                  Cadastre uma conta de casa de apostas primeiro.
                </p>
              )}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={cashbackStatus}
                  onValueChange={(v) =>
                    v && cashbackForm.setValue("status", v as "pendente")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="previsto">Previsto</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="recebido">Recebido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="expirado">Expirado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="any"
                    {...cashbackForm.register("amount", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" {...cashbackForm.register("occurred_at")} />
                </div>
              </div>
            </>
          )}

          {formType === "rakeback" && (
            <>
              <AccountCurrencySelect
                accounts={accounts}
                accountId={rakebackAccountId}
                currencyId={rakebackCurrencyId}
                onAccountChange={(accountId, defaultCurrencyId) => {
                  rakebackForm.setValue("account_id", accountId);
                  rakebackForm.setValue("currency_id", defaultCurrencyId);
                }}
                onCurrencyChange={(currencyId) =>
                  rakebackForm.setValue("currency_id", currencyId)
                }
                accountFilter={(a) => a.type === "betting"}
              />
              {bettingAccounts.length === 0 && (
                <p className="text-sm text-warning">
                  Cadastre uma conta de casa de apostas primeiro.
                </p>
              )}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={rakebackStatus}
                  onValueChange={(v) =>
                    v && rakebackForm.setValue("status", v as "pendente")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="previsto">Previsto</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="recebido">Recebido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="expirado">Expirado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="any"
                    {...rakebackForm.register("amount", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" {...rakebackForm.register("occurred_at")} />
                </div>
              </div>
            </>
          )}

          {(formType === "bet_won" || formType === "bet_lost") && (
            <>
              <AccountCurrencySelect
                accounts={accounts}
                accountId={betAccountId}
                currencyId={betCurrencyId}
                onAccountChange={(accountId, defaultCurrencyId) => {
                  betForm.setValue("account_id", accountId);
                  betForm.setValue("currency_id", defaultCurrencyId);
                }}
                onCurrencyChange={(currencyId) =>
                  betForm.setValue("currency_id", currencyId)
                }
                accountFilter={(a) => a.type === "betting"}
              />
              {bettingAccounts.length === 0 && (
                <p className="text-sm text-warning">
                  Cadastre uma conta de casa de apostas primeiro.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    {...betForm.register("amount", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" {...betForm.register("occurred_at")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>ID transação (opcional)</Label>
                <Input {...betForm.register("external_id")} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea rows={2} {...betForm.register("description")} />
              </div>
            </>
          )}

          {formType === "bonus" && (
            <>
              <AccountCurrencySelect
                accounts={accounts}
                accountId={bonusAccountId}
                currencyId={bonusCurrencyId}
                onAccountChange={(accountId, defaultCurrencyId) => {
                  bonusForm.setValue("account_id", accountId);
                  bonusForm.setValue("currency_id", defaultCurrencyId);
                }}
                onCurrencyChange={(currencyId) =>
                  bonusForm.setValue("currency_id", currencyId)
                }
                accountFilter={(a) => a.type === "betting"}
              />
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={bonusStatus}
                  onValueChange={(v) =>
                    v && bonusForm.setValue("status", v as "pendente")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="creditado">Creditado</SelectItem>
                    <SelectItem value="utilizado">Utilizado</SelectItem>
                    <SelectItem value="expirado">Expirado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={bonusWithdrawable}
                  onChange={(e) =>
                    bonusForm.setValue("withdrawable", e.target.checked)
                  }
                />
                Saldo retirável
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="any"
                    {...bonusForm.register("amount", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" {...bonusForm.register("occurred_at")} />
                </div>
              </div>
            </>
          )}

          {formType === "conversion" && (
            <>
              <div className="space-y-2">
                <Label>Conta (corretora/carteira)</Label>
                <Select
                  value={conversionAccountId}
                  onValueChange={(v) => {
                    if (!v) return;
                    conversionForm.setValue("account_id", v);
                    const acc = cryptoAccounts.find((a) => a.id === v);
                    if (acc && acc.balances.length >= 2) {
                      conversionForm.setValue(
                        "from_currency_id",
                        acc.balances[0].currency_id,
                      );
                      conversionForm.setValue(
                        "to_currency_id",
                        acc.balances[1].currency_id,
                      );
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {cryptoAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {cryptoAccounts.length === 0 && (
                <p className="text-sm text-warning">
                  Cadastre uma conta de corretora/carteira primeiro.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Moeda origem</Label>
                  <Select
                    value={conversionFromCurrencyId}
                    onValueChange={(v) =>
                      v && conversionForm.setValue("from_currency_id", v)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptoAccounts
                        .find((a) => a.id === conversionAccountId)
                        ?.balances.map((b) => (
                          <SelectItem key={b.currency_id} value={b.currency_id}>
                            {b.currency.code}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Quantidade"
                    {...conversionForm.register("from_amount", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Moeda destino</Label>
                  <Select
                    value={conversionToCurrencyId}
                    onValueChange={(v) =>
                      v && conversionForm.setValue("to_currency_id", v)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptoAccounts
                        .find((a) => a.id === conversionAccountId)
                        ?.balances.map((b) => (
                          <SelectItem key={b.currency_id} value={b.currency_id}>
                            {b.currency.code}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Quantidade"
                    {...conversionForm.register("to_amount", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cotação usada</Label>
                  <Input
                    type="number"
                    step="any"
                    {...conversionForm.register("exchange_rate", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taxa (opcional)</Label>
                  <Input
                    type="number"
                    step="any"
                    {...conversionForm.register("fee_amount", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" {...conversionForm.register("occurred_at")} />
              </div>
            </>
          )}

          {formType === "balance_adjustment" && (
            <>
              <AccountCurrencySelect
                accounts={accounts}
                accountId={adjustmentAccountId}
                currencyId={adjustmentCurrencyId}
                onAccountChange={(accountId, defaultCurrencyId) => {
                  adjustmentForm.setValue("account_id", accountId);
                  adjustmentForm.setValue("currency_id", defaultCurrencyId);
                }}
                onCurrencyChange={(currencyId) =>
                  adjustmentForm.setValue("currency_id", currencyId)
                }
              />
              <div className="space-y-2">
                <Label>Direção</Label>
                <Select
                  value={adjustmentDirection}
                  onValueChange={(v) =>
                    v &&
                    adjustmentForm.setValue("direction", v as "credit" | "debit")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Aumentar saldo</SelectItem>
                    <SelectItem value="debit">Diminuir saldo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Valor do ajuste</Label>
                  <Input
                    type="number"
                    step="any"
                    {...adjustmentForm.register("amount", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" {...adjustmentForm.register("occurred_at")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Motivo (obrigatório)</Label>
                <Textarea rows={3} {...adjustmentForm.register("reason")} />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
