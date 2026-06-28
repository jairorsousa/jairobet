"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { createBank, updateBank } from "@/features/banks/actions";
import {
  createBankSchema,
  type CreateBankInput,
} from "@/features/banks/schemas";
import { holderStatusLabels } from "@/shared/constants/labels";
import type { Bank } from "@/shared/types/database";

interface BankFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bank?: Bank | null;
  onSuccess?: () => void;
}

export function BankFormDialog({
  open,
  onOpenChange,
  bank,
  onSuccess,
}: BankFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(bank);

  const form = useForm<CreateBankInput>({
    resolver: zodResolver(createBankSchema),
    defaultValues: {
      name: "",
      notes: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: bank?.name ?? "",
        notes: bank?.notes ?? "",
        status: bank?.status ?? "active",
      });
    }
  }, [open, bank, form]);

  async function onSubmit(values: CreateBankInput) {
    setLoading(true);
    try {
      if (isEditing && bank) {
        await updateBank({ ...values, id: bank.id });
        toast.success("Banco atualizado");
      } else {
        await createBank(values);
        toast.success("Banco criado");
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
          <DialogTitle>{isEditing ? "Editar banco" : "Novo banco"}</DialogTitle>
          <DialogDescription>
            Instituição bancária ou fintech usada nas contas da operação.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...form.register("name")} placeholder="Ex.: Nubank" />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(v) =>
                v && form.setValue("status", v as CreateBankInput["status"])
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