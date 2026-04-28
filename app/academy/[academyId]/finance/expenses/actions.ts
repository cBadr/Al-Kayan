"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";

export async function addExpense(academyId: string, fd: FormData) {
  const me = await requireAcademyManager(academyId);
  const sb = await createClient();
  await sb.from("expenses").insert({
    academy_id: academyId,
    description: String(fd.get("description")),
    amount: Number(fd.get("amount")),
    spent_at: String(fd.get("spent_at") || new Date().toISOString().slice(0, 10)),
    category_id: (fd.get("category_id") as string) || null,
    created_by: me.id,
  });
  revalidatePath(`/academy/${academyId}/finance/expenses`);
}

export async function addExpenseCategory(academyId: string, fd: FormData) {
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return;
  await sb.from("expense_categories").insert({ academy_id: academyId, name });
  revalidatePath(`/academy/${academyId}/finance/expenses`);
}
