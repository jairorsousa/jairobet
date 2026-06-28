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
import { createHolder, updateHolder } from "@/features/holders/actions";
import {
  createHolderSchema,
  type CreateHolderInput,
} from "@/features/holders/schemas";
import { holderStatusLabels } from "@/shared/constants/labels";
import type { Holder } from "@/shared/types/database";

interface HolderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holder?: Holder | null;
  onSuccess?: () => void;
}

export function HolderFormDialog({
  open,
  onOpenChange,
  holder,
  onSuccess,
}: HolderFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(holder);

  const form = useForm<CreateHolderInput>({
    resolver: zodResolver(createHolderSchema),
    defaultValues: {
      name: "",
      notes: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: holder?.name ?? "",
        notes: holder?.notes ?? "",
        status: holder?.status ?? "active",
      });
    }
  }, [open, holder, form]);

  async function onSubmit(values: CreateHolderInput) {
    setLoading(true);
    try {
      if (isEditing && holder) {
        await updateHolder({ ...values, id: holder.id });
        toast.success("Titular atualizado");
      } else {
        await createHolder(values);
        toast.success("Titular criado");
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
          <DialogTitle>{isEditing ? "Editar titular" : "Novo titular"}</DialogTitle>
          <DialogDescription>
            Pessoa vinculada às contas da operação.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome ou apelido</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(v) =>
                v && form.setValue("status", v as CreateHolderInput["status"])
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