"use server";

import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(ids: string[]) {
  if (ids.length === 0) return;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  await sb.from("notifications")
    .update({ read_at: new Date().toISOString() })
    .in("id", ids)
    .eq("recipient_user_id", user.id);
}
