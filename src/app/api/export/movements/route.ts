import { type NextRequest } from "next/server";
import { listAllMovements } from "@/features/movements/actions";
import {
  movementStatusLabels,
  movementTypeLabels,
} from "@/shared/lib/domain/movement-labels";
import { csvResponse } from "@/shared/lib/export/csv";
import { createClient } from "@/shared/lib/supabase/server";
import type { MovementType } from "@/shared/types/database";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Não autorizado", { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const movements = await listAllMovements({
    type: (params.get("type") as MovementType | null) ?? "all",
    holder_id: params.get("holder") ?? "all",
    account_id: params.get("account") ?? "all",
    from_date: params.get("from") ?? undefined,
    to_date: params.get("to") ?? undefined,
  });

  const rows = movements.map((m) => [
    m.occurred_at,
    movementTypeLabels[m.type],
    m.account.name,
    m.account.holder.name,
    m.currency.code,
    m.direction === "credit" ? m.amount : -m.amount,
    m.amount_brl,
    movementStatusLabels[m.status] ?? m.status,
    m.description ?? "",
    m.external_id ?? "",
  ]);

  return csvResponse("movimentacoes.csv", [
    "Data",
    "Tipo",
    "Conta",
    "Titular",
    "Moeda",
    "Valor",
    "Valor BRL",
    "Status",
    "Descrição",
    "ID externo",
  ], rows);
}