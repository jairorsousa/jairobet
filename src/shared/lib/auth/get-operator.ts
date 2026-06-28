import { createClient } from "@/shared/lib/supabase/server";

export async function getOperatorId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Não autenticado");
  }

  return user.id;
}