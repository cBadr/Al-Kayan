import { createAdminClient } from "@/lib/supabase/admin";

export async function signedUrl(path: string | null, ttl = 600): Promise<string | null> {
  if (!path) return null;
  const admin = createAdminClient();
  const { data } = await admin.storage.from("join-docs").createSignedUrl(path, ttl);
  return data?.signedUrl ?? null;
}

export async function signedUrlMap(paths: (string | null)[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  await Promise.all(
    paths.filter((p): p is string => !!p).map(async (p) => {
      const u = await signedUrl(p);
      if (u) out.set(p, u);
    }),
  );
  return out;
}
