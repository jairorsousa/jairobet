"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { createTransfer } from "@/features/movements/actions";
import type { CreateTransferInput } from "@/features/movements/schemas";
import { formatMoney } from "@/shared/lib/money/format";
import type { AccountWithDetails } from "@/shared/types/database";

const STEPS = ["Origem", "Destino", "Valores", "Detalhes", "Confirmar"];

interface TransferWizardProps {
  accounts: AccountWithDetails[];
}

export function TransferWizard({ accounts }: TransferWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<Partial<CreateTransferInput>>({
    status: "pending",
    occurred_at: new Date().toISOString().slice(0, 10),
    sent_amount: 0,
    expected_received_amount: 0,
    received_amount: undefined,
    fee_amount: 0,
  });

  const fromAccount = useMemo(
    () => accounts.find((a) => a.id === form.from_account_id),
    [accounts, form.from_account_id],
  );
  const toAccount = useMemo(
    () => accounts.find((a) => a.id === form.to_account_id),
    [accounts, form.to_account_id],
  );

  const fromCurrency = fromAccount?.balances.find(
    (b) => b.currency_id === form.from_currency_id,
  )?.currency;
  const toCurrency = toAccount?.balances.find(
    (b) => b.currency_id === form.to_currency_id,
  )?.currency;

  const fromBalance = fromAccount?.balances.find(
    (b) => b.currency_id === form.from_currency_id,
  );

  function updateField<K extends keyof CreateTransferInput>(
    key: K,
    value: CreateTransferInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (
      !form.from_account_id ||
      !form.from_currency_id ||
      !form.to_account_id ||
      !form.to_currency_id ||
      !form.sent_amount ||
      !form.occurred_at ||
      !form.status
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      await createTransfer({
        from_account_id: form.from_account_id,
        from_currency_id: form.from_currency_id,
        to_account_id: form.to_account_id,
        to_currency_id: form.to_currency_id,
        sent_amount: form.sent_amount,
        expected_received_amount: form.expected_received_amount,
        received_amount: form.received_amount,
        fee_amount: form.fee_amount,
        status: form.status,
        occurred_at: form.occurred_at,
        method: form.method,
        external_id: form.external_id,
        description: form.description,
      });
      toast.success("Transferência registrada");
      router.push("/transferencias");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STEPS.map((label, index) => (
          <div
            key={label}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
              index === step
                ? "bg-primary text-primary-foreground"
                : index < step
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {index + 1}. {label}
          </div>
        ))}
      </div>

      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>Conta de origem</Label>
                <Select
                  value={form.from_account_id ?? ""}
                  onValueChange={(v) => {
                    if (!v) return;
                    const account = accounts.find((a) => a.id === v);
                    updateField("from_account_id", v);
                    updateField(
                      "from_currency_id",
                      account?.default_currency_id ?? "",
                    );
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} · {account.holder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Moeda enviada</Label>
                <Select
                  value={form.from_currency_id ?? ""}
                  onValueChange={(v) => v && updateField("from_currency_id", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fromAccount?.balances.map((b) => (
                      <SelectItem key={b.currency_id} value={b.currency_id}>
                        {b.currency.code} — saldo{" "}
                        {formatMoney(
                          b.calculated_balance,
                          b.currency.code,
                          b.currency.decimal_places,
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fromBalance && fromBalance.calculated_balance < 0 && (
                  <p className="text-sm text-destructive">
                    Saldo negativo após lançamentos anteriores
                  </p>
                )}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Conta de destino</Label>
                <Select
                  value={form.to_account_id ?? ""}
                  onValueChange={(v) => {
                    if (!v) return;
                    const account = accounts.find((a) => a.id === v);
                    updateField("to_account_id", v);
                    updateField(
                      "to_currency_id",
                      account?.default_currency_id ?? "",
                    );
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((a) => a.id !== form.from_account_id)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} · {account.holder.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Moeda esperada no destino</Label>
                <Select
                  value={form.to_currency_id ?? ""}
                  onValueChange={(v) => v && updateField("to_currency_id", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {toAccount?.balances.map((b) => (
                      <SelectItem key={b.currency_id} value={b.currency_id}>
                        {b.currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Valor enviado</Label>
                <Input
                  type="number"
                  step="any"
                  min="0.00000001"
                  value={form.sent_amount || ""}
                  onChange={(e) =>
                    updateField("sent_amount", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Valor esperado no destino</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={form.expected_received_amount || ""}
                  onChange={(e) =>
                    updateField(
                      "expected_received_amount",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Taxa (opcional)</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={form.fee_amount || ""}
                  onChange={(e) =>
                    updateField("fee_amount", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status ?? "pending"}
                  onValueChange={(v) =>
                    v &&
                    updateField("status", v as CreateTransferInput["status"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente (em trânsito)</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.status === "completed" && (
                <div className="space-y-2">
                  <Label>Valor efetivamente recebido</Label>
                  <Input
                    type="number"
                    step="any"
                    min="0.00000001"
                    value={form.received_amount || ""}
                    onChange={(e) =>
                      updateField(
                        "received_amount",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.occurred_at ?? ""}
                  onChange={(e) => updateField("occurred_at", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Método</Label>
                <Input
                  placeholder="Pix, TED, TRC20…"
                  value={form.method ?? ""}
                  onChange={(e) => updateField("method", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>ID da transação (opcional)</Label>
                <Input
                  value={form.external_id ?? ""}
                  onChange={(e) => updateField("external_id", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Observação</Label>
                <Textarea
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>
            </>
          )}

          {step === 4 && (
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">De: </span>
                {fromAccount?.name} ({fromCurrency?.code})
              </p>
              <p>
                <span className="text-muted-foreground">Para: </span>
                {toAccount?.name} ({toCurrency?.code})
              </p>
              <p>
                <span className="text-muted-foreground">Enviado: </span>
                {fromCurrency &&
                  formatMoney(
                    form.sent_amount ?? 0,
                    fromCurrency.code,
                    fromCurrency.decimal_places,
                  )}
              </p>
              <p>
                <span className="text-muted-foreground">Status: </span>
                {form.status === "pending" ? "Pendente" : "Concluída"}
              </p>
              {form.status === "completed" && (
                <p>
                  <span className="text-muted-foreground">Recebido: </span>
                  {toCurrency &&
                    formatMoney(
                      form.received_amount ?? 0,
                      toCurrency.code,
                      toCurrency.decimal_places,
                    )}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              Voltar
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)}>
                Próximo
              </Button>
            ) : (
              <Button
                type="button"
                className="shadow-gold"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? "Salvando…" : "Confirmar transferência"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}