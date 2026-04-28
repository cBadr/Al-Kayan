"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";

export async function addRevenue(academyId: string, fd: FormData) {
  await requireAcademyManager(academyId);
  const sb = await createClient();
  await sb.from("extra_revenues").insert({
    academy_id: academyId,
    source: String(fd.get("source")),
    amount: Number(fd.get("amount")),
    received_at: String(fd.get("received_at") || new Date().toISOString().slice(0, 10)),
    notes: (fd.get("notes") as string) || null,
  });
  revalidatePath(`/academy/${academyId}/finance/revenues`);
}

export async function deleteRevenue(academyId: string, id: string) {
  await requireAcademyManager(academyId);
  const sb = await createClient();
  await sb.from("extra_revenues").delete().eq("id", id).eq("academy_id", academyId);
  revalidatePath(`/academy/${academyId}/finance/revenues`);
}
