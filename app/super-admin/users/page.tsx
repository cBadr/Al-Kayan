import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/rbac";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "مدير عام",
  academy_manager: "مدير أكاديمية",
  coach: "مدرب",
  player: "لاعب",
};

export default async function UsersPage() {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const [{ data: { users } }, { data: memberships }, { data: academies }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    admin.from("memberships").select("user_id, academy_id, role"),
    admin.from("academies").select("id, name"),
  ]);

  const academyMap = new Map((academies ?? []).map((a: any) => [a.id, a.name]));
  const membershipsByUser = new Map<string, Array<{ role: string; academy: string }>>();
  for (const m of (memberships ?? []) as any[]) {
    const list = membershipsByUser.get(m.user_id) ?? [];
    list.push({
      role: ROLE_LABEL[m.role] ?? m.role,
      academy: m.academy_id ? (academyMap.get(m.academy_id) ?? "—") : "عالمي",
    });
    membershipsByUser.set(m.user_id, list);
  }

  return (
    <>
      <PageHeader title="المستخدمون" description="كل المستخدمين المسجَّلين في النظام وأدوارهم" />
      <PageBody>
        <Card>
          <CardHeader><CardTitle>القائمة ({users.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr><Th>البريد</Th><Th>الاسم</Th><Th>الأدوار</Th><Th>التسجيل</Th></Tr>
              </THead>
              <TBody>
                {users.map((u: any) => {
                  const ms = membershipsByUser.get(u.id) ?? [];
                  return (
                    <Tr key={u.id}>
                      <Td dir="ltr" className="font-mono text-xs">{u.email}</Td>
                      <Td>{u.user_metadata?.full_name ?? "—"}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {ms.length === 0 && <span className="text-muted-foreground text-xs">— لا أدوار —</span>}
                          {ms.map((x, i) => (
                            <Badge key={i} variant={x.role === "مدير عام" ? "default" : "muted"}>
                              {x.role} {x.academy !== "عالمي" ? `· ${x.academy}` : ""}
                            </Badge>
                          ))}
                        </div>
                      </Td>
                      <Td className="text-xs text-muted-foreground" dir="ltr">
                        {new Date(u.created_at).toLocaleDateString("ar-EG")}
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}
