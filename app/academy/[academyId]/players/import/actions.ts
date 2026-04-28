"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\r") { /* ignore */ }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export async function importPlayersCsv(academyId: string, fd: FormData) {
  await requireAcademyManager(academyId);
  const file = fd.get("file") as File | null;
  const defaultCategory = (fd.get("default_category") as string) || null;

  if (!file || file.size === 0) {
    redirect(`/academy/${academyId}/players/import?error=${encodeURIComponent("لم يُرفع ملف")}`);
  }

  const text = await file!.text();
  const rows = parseCsv(text);
  if (rows.length < 2) {
    redirect(`/academy/${academyId}/players/import?error=${encodeURIComponent("الملف فارغ أو بلا بيانات")}`);
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (k: string) => headers.indexOf(k);
  const colName = idx("full_name");
  if (colName < 0) {
    redirect(`/academy/${academyId}/players/import?error=${encodeURIComponent("العمود full_name مفقود")}`);
  }

  const sb = await createClient();
  const { data: cats } = await sb.from("categories").select("id, name").eq("academy_id", academyId);
  const catMap = new Map<string, string>((cats ?? []).map((c: any) => [c.name.trim(), c.id]));

  const inserts: any[] = [];
  let skipped = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = (r[colName] ?? "").trim();
    if (!name) { skipped++; continue; }
    const catName = idx("category") >= 0 ? (r[idx("category")] ?? "").trim() : "";
    const categoryId = catName ? (catMap.get(catName) ?? defaultCategory) : defaultCategory;

    inserts.push({
      academy_id: academyId,
      full_name: name,
      category_id: categoryId,
      birth_date: idx("birth_date") >= 0 ? (r[idx("birth_date")] || null) : null,
      phone: idx("phone") >= 0 ? (r[idx("phone")] || null) : null,
      email: idx("email") >= 0 ? (r[idx("email")] || null) : null,
      national_id: idx("national_id") >= 0 ? (r[idx("national_id")] || null) : null,
      guardian_name: idx("guardian_name") >= 0 ? (r[idx("guardian_name")] || null) : null,
      guardian_phone: idx("guardian_phone") >= 0 ? (r[idx("guardian_phone")] || null) : null,
    });
  }

  let created = 0;
  if (inserts.length > 0) {
    const { error, count } = await sb.from("players").insert(inserts, { count: "exact" } as any);
    if (error) {
      redirect(`/academy/${academyId}/players/import?error=${encodeURIComponent(error.message)}`);
    }
    created = count ?? inserts.length;
  }

  revalidatePath(`/academy/${academyId}/players`);
  redirect(`/academy/${academyId}/players/import?ok=1&created=${created}&skipped=${skipped}`);
}
