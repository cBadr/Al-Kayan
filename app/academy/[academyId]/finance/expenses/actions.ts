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

export async function renameExpenseCategory(academyId: string, id: string, name: string) {
  await requireAcademyManager(academyId);
  const trimmed = name.trim();
  if (!trimmed) return { error: "الاسم لا يمكن أن يكون فارغاً" };
  const sb = await createClient();
  const { error } = await sb.from("expense_categories")
    .update({ name: trimmed })
    .eq("id", id)
    .eq("academy_id", academyId);
  if (error) return { error: error.message };
  revalidatePath(`/academy/${academyId}/finance/expenses`);
}

export async function deleteExpenseCategory(academyId: string, id: string) {
  await requireAcademyManager(academyId);
  const sb = await createClient();
  // Existing expenses with this category will have category_id set to null (FK on delete set null).
  const { error } = await sb.from("expense_categories")
    .delete()
    .eq("id", id)
    .eq("academy_id", academyId);
  if (error) return { error: error.message };
  revalidatePath(`/academy/${academyId}/finance/expenses`);
}
