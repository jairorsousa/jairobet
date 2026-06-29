"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  createCryptoBroker,
  updateCryptoBroker,
} from "@/features/crypto-brokers/actions";
import {
  createCryptoBrokerSchema,
  type CreateCryptoBrokerInput,
} from "@/features/crypto-brokers/schemas";
import { holderStatusLabels } from "@/shared/constants/labels";
import type { CryptoBroker } from "@/shared/types/database";

interface CryptoBrokerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  broker?: CryptoBroker | null;
  onSuccess?: () => void;
}

export function CryptoBrokerFormDialog({
  open,
  onOpenChange,
  broker,
  onSuccess,
}: CryptoBrokerFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(broker);

  const form = useForm<CreateCryptoBrokerInput>({
    resolver: zodResolver(createCryptoBrokerSchema),
    defaultValues: {
      name: "",
      notes: "",
      status: "active",
    },
  });
  const status = useWatch({ control: form.control, name: "status" });

  useEffect(() => {
    if (open) {
      form.reset({
        name: broker?.name ?? "",
        notes: broker?.notes ?? "",
        status: broker?.status ?? "active",
      });
    }
  }, [open, broker, form]);

  async function onSubmit(values: CreateCryptoBrokerInput) {
    setLoading(true);
    try {
      if (isEditing && broker) {
        await updateCryptoBroker({ ...values, id: broker.id });
        toast.success("Corretora atualizada");
      } else {
        await createCryptoBroker(values);
        toast.success("Corretora criada");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar corretora" : "Nova corretora / carteira"}
          </DialogTitle>
          <DialogDescription>
            Corretora ou carteira de cripto usada nas contas da operação.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Ex.: Binance, Mercado Bitcoin"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status ?? "active"}
              onValueChange={(v) =>
                v && form.setValue("status", v as CreateCryptoBrokerInput["status"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(holderStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" rows={3} {...form.register("notes")} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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
