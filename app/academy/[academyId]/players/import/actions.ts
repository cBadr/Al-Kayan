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

    const get = (k: string) => idx(k) >= 0 ? (r[idx(k)] ?? "").trim() || null : null;

    // Position normalization: accept code (GK/DF/MF/FW) or Arabic name
    const POS_MAP: Record<string, "GK" | "DF" | "MF" | "FW"> = {
      gk: "GK", df: "DF", mf: "MF", fw: "FW",
      "حارس": "GK", "حارس مرمى": "GK",
      "دفاع": "DF", "مدافع": "DF",
      "وسط": "MF", "لاعب وسط": "MF",
      "هجوم": "FW", "مهاجم": "FW",
    };
    const rawPos = get("position");
    const position = rawPos ? (POS_MAP[rawPos.toLowerCase()] ?? POS_MAP[rawPos] ?? null) : null;

    // Status normalization
    const STATUS_MAP: Record<string, "active" | "suspended" | "archived"> = {
      active: "active", suspended: "suspended", archived: "archived",
      "نشط": "active", "موقوف": "suspended", "مؤرشف": "archived",
    };
    const rawStatus = get("status");
    const status = rawStatus ? (STATUS_MAP[rawStatus.toLowerCase()] ?? STATUS_MAP[rawStatus] ?? "active") : "active";

    const jersey = get("preferred_jersey");
    const jerseyNum = jersey ? Number(jersey) : null;

    inserts.push({
      academy_id: academyId,
      full_name: name,
      category_id: categoryId,
      birth_date: get("birth_date"),
      phone: get("phone"),
      email: get("email"),
      national_id: get("national_id"),
      guardian_name: get("guardian_name"),
      guardian_phone: get("guardian_phone"),
      position,
      preferred_jersey: jerseyNum && Number.isFinite(jerseyNum) && jerseyNum >= 1 && jerseyNum <= 99 ? jerseyNum : null,
      notes: get("notes"),
      status,
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
