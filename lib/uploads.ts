"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/** Upload a single image File to a public bucket and return its public URL. */
export async function uploadImage(
  bucket: "logos" | "asset-images" | "join-docs",
  file: File,
  prefix: string,
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from(bucket).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) return null;

  if (bucket === "join-docs") {
    return path; // private — caller resolves via signedUrl
  }
  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadIfPresent(
  bucket: "logos" | "asset-images" | "join-docs",
  fd: FormData,
  formKey: string,
  prefix: string,
): Promise<string | null> {
  const f = fd.get(formKey);
  if (!f || typeof f === "string") return null;
  return uploadImage(bucket, f as File, prefix);
}
