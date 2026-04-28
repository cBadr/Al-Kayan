"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess, requireAcademyManager } from "@/lib/auth/rbac";

type Status = "present" | "absent" | "late";

export async function setAttendance(academyId: string, trainingId: string, playerId: string, status: Status) {
  const me = await requireAcademyAccess(academyId);
  const sb = await createClient();

  const { data: existing } = await sb.from("attendance_records")
    .select("id, locked_at").eq("training_id", trainingId).eq("player_id", playerId).maybeSingle();

  const isManager = me.isSuperAdmin || me.managedAcademyIds.includes(academyId);

  if (existing) {
    if (!isManager && new Date(existing.locked_at).getTime() < Date.now()) {
      return { error: "انتهت نافذة التعديل" };
    }
    await sb.from("attendance_records").update({
      status,
      recorded_by: me.id,
      recorded_at: new Date().toISOString(),
    }).eq("id", existing.id);
    if (isManager) {
      await sb.from("audit_log").insert({
        academy_id: academyId, actor_user_id: me.id, action: "attendance.update",
        entity_type: "attendance_records", entity_id: existing.id,
        metadata: { player_id: playerId, status },
      });
    }
  } else {
    await sb.from("attendance_records").insert({
      training_id: trainingId, player_id: playerId, status,
      recorded_by: me.id, recorded_at: new Date().toISOString(),
    });
  }
  revalidatePath(`/academy/${academyId}/attendance`);
}

export async function overrideLock(academyId: string, trainingId: string, playerId: string) {
  const me = await requireAcademyManager(academyId);
  const sb = await createClient();
  // Extend lock by 30 more minutes
  const newLock = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  await sb.from("attendance_records").update({ locked_at: newLock })
    .eq("training_id", trainingId).eq("player_id", playerId);
  await sb.from("audit_log").insert({
    academy_id: academyId, actor_user_id: me.id, action: "attendance.lock_override",
    entity_type: "attendance_records",
    metadata: { training_id: trainingId, player_id: playerId },
  });
  revalidatePath(`/academy/${academyId}/attendance`);
}
