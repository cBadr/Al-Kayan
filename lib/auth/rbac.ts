import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string | null;
  isSuperAdmin: boolean;
  memberships: Array<{ academy_id: string | null; role: UserRole }>;
  /** ids of academies the user can access (excluding super admin global). */
  academyIds: string[];
  /** ids of academies the user manages (manager or super_admin). */
  managedAcademyIds: string[];
  /** ids of academies the user coaches in. */
  coachedAcademyIds: string[];
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await sb
    .from("memberships")
    .select("academy_id, role")
    .eq("user_id", user.id);

  const { data: profile } = await sb
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const m = memberships ?? [];
  const isSuperAdmin = m.some((x) => x.role === "super_admin");

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? null,
    isSuperAdmin,
    memberships: m,
    academyIds: m.filter((x) => x.academy_id).map((x) => x.academy_id!),
    managedAcademyIds: m.filter((x) => x.role === "academy_manager" && x.academy_id).map((x) => x.academy_id!),
    coachedAcademyIds: m.filter((x) => x.role === "coach" && x.academy_id).map((x) => x.academy_id!),
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireRole(roles: UserRole[]): Promise<CurrentUser> {
  const u = await requireUser();
  const ok = u.memberships.some((m) => roles.includes(m.role));
  if (!ok) redirect("/");
  return u;
}

export async function requireSuperAdmin(): Promise<CurrentUser> {
  const u = await requireUser();
  if (!u.isSuperAdmin) redirect("/");
  return u;
}

export async function requireAcademyAccess(academyId: string): Promise<CurrentUser> {
  const u = await requireUser();
  const ok = u.isSuperAdmin || u.academyIds.includes(academyId);
  if (!ok) redirect("/");
  return u;
}

export async function requireAcademyManager(academyId: string): Promise<CurrentUser> {
  const u = await requireUser();
  const ok = u.isSuperAdmin || u.managedAcademyIds.includes(academyId);
  if (!ok) redirect("/");
  return u;
}
