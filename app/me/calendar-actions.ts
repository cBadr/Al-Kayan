"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/rbac";

/** Cryptographically random 48-char hex token (192 bits). */
function generateToken(): string {
  const buf = new Uint8Array(24);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Returns the user's calendar token, generating one if missing. Idempotent. */
export async function getOrCreateCalendarToken(): Promise<{ token?: string; error?: string }> {
  const me = await requireUser();
  const sb = await createClient();

  const { data: profile } = await sb.from("profiles").select("calendar_token").eq("id", me.id).maybeSingle();
  if (profile?.calendar_token) return { token: profile.calendar_token };

  // Generate + insert/update via admin client (RLS on profiles is restrictive)
  const token = generateToken();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").upsert(
    { id: me.id, calendar_token: token },
    { onConflict: "id" },
  );
  if (error) return { error: error.message };
  return { token };
}

/** Rotate the token — invalidates any existing subscriptions. */
export async function regenerateCalendarToken(): Promise<{ token?: string; error?: string }> {
  const me = await requireUser();
  const admin = createAdminClient();
  const token = generateToken();
  const { error } = await admin.from("profiles").upsert(
    { id: me.id, calendar_token: token },
    { onConflict: "id" },
  );
  if (error) return { error: error.message };
  revalidatePath("/me");
  return { token };
}
