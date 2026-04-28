import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { formatDate } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/admin";

const ACTION_LABELS: Record<string, { label: string; tone: "default" | "warning" | "destructive" }> = {
  "attendance.update": { label: "تعديل حضور", tone: "default" },
  "attendance.lock_override": { label: "فتح قفل الحضور", tone: "warning" },
  "notifications.send": { label: "إرسال إشعار", tone: "default" },
};

export default async function AuditPage({ params, searchParams }: {
  params: Promise<{ academyId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { academyId } = await params;
  const sp = await searchParams;
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const page = Math.max(1, Number(sp.page ?? 1));
  const pageSize = 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: rows, count } = await sb
    .from("audit_log")
    .select("*", { count: "exact" })
    .eq("academy_id", academyId)
    .order("created_at", { ascending: false })
    .range(from, to);

  // Resolve actor names
  const userIds = Array.from(new Set(((rows ?? []) as any[]).map((r) => r.actor_user_id).filter(Boolean)));
  const adminClient = createAdminClient();
  const userMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: users } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 200 });
    for (const u of (users?.users ?? [])) {
      if (userIds.includes(u.id)) userMap.set(u.id, u.email ?? u.id);
    }
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));

  return (
    <>
      <PageHeader
        title="سجل التدقيق"
        description="كل العمليات الحساسة المسجَّلة في الأكاديمية"
      />
      <PageBody>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <THead><Tr><Th>التاريخ</Th><Th>المستخدم</Th><Th>العملية</Th><Th>التفاصيل</Th></Tr></THead>
              <TBody>
                {(rows ?? []).map((r: any) => {
                  const a = ACTION_LABELS[r.action] ?? { label: r.action, tone: "default" as const };
                  return (
                    <Tr key={r.id}>
                      <Td className="text-xs">{formatDate(r.created_at, true)}</Td>
                      <Td className="text-xs" dir="ltr">{userMap.get(r.actor_user_id) ?? "—"}</Td>
                      <Td><Badge variant={a.tone as any}>{a.label}</Badge></Td>
                      <Td className="text-xs text-muted-foreground" dir="ltr">
                        <code className="bg-muted/50 px-1 rounded">{JSON.stringify(r.metadata ?? {})}</code>
                      </Td>
                    </Tr>
                  );
                })}
                {(rows ?? []).length === 0 && (
                  <Tr><Td colSpan={4} className="text-center py-8 text-muted-foreground">لا توجد سجلات</Td></Tr>
                )}
              </TBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center gap-1 mt-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={`?page=${p}`}
                    className={`px-3 py-1.5 rounded-md text-sm border ${p === page ? "bg-emerald-700 text-white border-emerald-700" : "border-border hover:bg-muted"}`}
                  >{p}</a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}
