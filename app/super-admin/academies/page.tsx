import { PageBody, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/rbac";
import Link from "next/link";
import { AcademyActions } from "./academy-actions";

export const dynamic = "force-dynamic";

export default async function AcademiesPage() {
  await requireSuperAdmin();
  const sb = await createClient();
  const { data: academies } = await sb.from("academies").select("*").order("created_at", { ascending: false });

  // Per-academy player counts (for context before deleting)
  const academyIds = (academies ?? []).map((a) => a.id);
  const countMap = new Map<string, number>();
  if (academyIds.length > 0) {
    const { data: rows } = await sb.from("players")
      .select("academy_id")
      .in("academy_id", academyIds);
    for (const row of rows ?? []) {
      countMap.set(row.academy_id, (countMap.get(row.academy_id) ?? 0) + 1);
    }
  }

  return (
    <>
      <PageHeader
        title="القطاعات"
        description={`إدارة القطاعات (${(academies ?? []).length}) داخل المنصة`}
        actions={<Button asChild><Link href="/super-admin/academies/new">+ إضافة قطاع</Link></Button>}
      />
      <PageBody>
        <Table>
          <THead>
            <Tr>
              <Th>الاسم</Th>
              <Th>الـ Slug</Th>
              <Th>الهاتف</Th>
              <Th>البريد</Th>
              <Th>اللاعبون</Th>
              <Th className="text-left">إدارة</Th>
            </Tr>
          </THead>
          <TBody>
            {(academies ?? []).map((a) => (
              <Tr key={a.id}>
                <Td className="font-medium">
                  <Link href={`/academy/${a.id}`} className="hover:text-emerald-700 hover:underline">
                    {a.name}
                  </Link>
                </Td>
                <Td dir="ltr" className="font-mono text-xs">{a.slug}</Td>
                <Td dir="ltr" className="text-xs">{a.phone || "—"}</Td>
                <Td dir="ltr" className="text-xs">{a.email || "—"}</Td>
                <Td className="ltr-numbers font-bold text-emerald-700">{countMap.get(a.id) ?? 0}</Td>
                <Td className="text-left">
                  <AcademyActions academyId={a.id} academyName={a.name} slug={a.slug} />
                </Td>
              </Tr>
            ))}
            {(academies ?? []).length === 0 && (
              <Tr><Td colSpan={6} className="text-center text-muted-foreground py-8">لا توجد قطاعات</Td></Tr>
            )}
          </TBody>
        </Table>
      </PageBody>
    </>
  );
}
