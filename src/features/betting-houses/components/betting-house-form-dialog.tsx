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
import {
  createBettingHouse,
  updateBettingHouse,
} from "@/features/betting-houses/actions";
import {
  createBettingHouseSchema,
  type CreateBettingHouseInput,
} from "@/features/betting-houses/schemas";
import { holderStatusLabels } from "@/shared/constants/labels";
import type { BettingHouse } from "@/shared/types/database";

interface BettingHouseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  house?: BettingHouse | null;
  onSuccess?: () => void;
}

export function BettingHouseFormDialog({
  open,
  onOpenChange,
  house,
  onSuccess,
}: BettingHouseFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(house);

  const form = useForm<CreateBettingHouseInput>({
    resolver: zodResolver(createBettingHouseSchema),
    defaultValues: {
      name: "",
      notes: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: house?.name ?? "",
        notes: house?.notes ?? "",
        status: house?.status ?? "active",
      });
    }
  }, [open, house, form]);

  async function onSubmit(values: CreateBettingHouseInput) {
    setLoading(true);
    try {
      if (isEditing && house) {
        await updateBettingHouse({ ...values, id: house.id });
        toast.success("Casa de apostas atualizada");
      } else {
        await createBettingHouse(values);
        toast.success("Casa de apostas criada");
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
            {isEditing ? "Editar casa de apostas" : "Nova casa de apostas"}
          </DialogTitle>
          <DialogDescription>
            Plataforma de apostas usada nas contas da operação.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Ex.: Bet365"
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
              value={form.watch("status")}
              onValueChange={(v) =>
                v && form.setValue("status", v as CreateBettingHouseInput["status"])
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