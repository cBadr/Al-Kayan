"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { uploadIfPresent } from "@/lib/uploads";

export async function addAsset(academyId: string, fd: FormData) {
  await requireAcademyManager(academyId);
  const image = await uploadIfPresent("asset-images", fd, "image", `academies/${academyId}/assets`);
  const sb = await createClient();
  await sb.from("assets").insert({
    academy_id: academyId,
    name: String(fd.get("name")),
    quantity: Number(fd.get("quantity") ?? 1),
    storage_location: (fd.get("storage_location") as string) || null,
    custodian: (fd.get("custodian") as string) || null,
    image_url: image,
  });
  revalidatePath(`/academy/${academyId}/assets`);
}

export async function updateAssetCondition(academyId: string, assetId: string, fd: FormData) {
  await requireAcademyManager(academyId);
  const sb = await createClient();
  await sb.from("assets").update({
    condition: String(fd.get("condition")),
    last_inventory_at: new Date().toISOString().slice(0, 10),
  }).eq("id", assetId).eq("academy_id", academyId);
  revalidatePath(`/academy/${academyId}/assets`);
}

export async function deleteAsset(academyId: string, assetId: string) {
  await requireAcademyManager(academyId);
  const sb = await createClient();
  await sb.from("assets").delete().eq("id", assetId).eq("academy_id", academyId);
  revalidatePath(`/academy/${academyId}/assets`);
}
