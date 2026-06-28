"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCurrencyRate } from "@/features/currencies/actions";
import {
  updateCurrencyRateSchema,
  type UpdateCurrencyRateInput,
} from "@/features/currencies/schemas";
import { formatMoney } from "@/shared/lib/money/format";
import type { Currency } from "@/shared/types/database";

interface CurrenciesListProps {
  currencies: Currency[];
}

export function CurrenciesList({ currencies: initial }: CurrenciesListProps) {
  const [currencies, setCurrencies] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<UpdateCurrencyRateInput>({
    resolver: zodResolver(updateCurrencyRateSchema),
  });

  function startEdit(currency: Currency) {
    setEditingId(currency.id);
    form.reset({
      id: currency.id,
      last_rate_brl: currency.last_rate_brl,
    });
  }

  async function onSubmit(values: UpdateCurrencyRateInput) {
    setLoading(true);
    try {
      const updated = await updateCurrencyRate(values);
      setCurrencies((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
      setEditingId(null);
      toast.success("Cotação atualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {currencies.map((currency) => (
        <Card key={currency.id} className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-lg">
              <span>
                {currency.code}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {currency.name}
                </span>
              </span>
              <span className="text-xs font-normal text-muted-foreground uppercase">
                {currency.type}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editingId === currency.id ? (
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex items-end gap-2"
              >
                <div className="flex-1 space-y-2">
                  <Label>Cotação em BRL</Label>
                  <Input
                    type="number"
                    step="any"
                    min="0.00000001"
                    {...form.register("last_rate_brl", { valueAsNumber: true })}
                  />
                </div>
                <Button type="submit" size="sm" disabled={loading}>
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingId(null)}
                >
                  Cancelar
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">1 {currency.code} =</p>
                  <p className="font-display text-xl">
                    {currency.code === "BRL"
                      ? formatMoney(1, "BRL")
                      : formatMoney(currency.last_rate_brl, "BRL")}
                  </p>
                </div>
                {currency.code !== "BRL" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(currency)}
                  >
                    Editar
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}