import { createClient as createSbClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Service-role client. Throws clearly if env is missing at runtime. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase env missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  return createSbClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hasSupabaseEnv() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
