import { PageBody, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AcademiesPage() {
  const sb = await createClient();
  const { data: academies } = await sb.from("academies").select("*").order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="الأكاديميات"
        description="إدارة الأكاديميات داخل المنصة"
        actions={<Button asChild><Link href="/super-admin/academies/new">إضافة أكاديمية</Link></Button>}
      />
      <PageBody>
        <Table>
          <THead>
            <Tr>
              <Th>الاسم</Th>
              <Th>الـ Slug</Th>
              <Th>الهاتف</Th>
              <Th>البريد</Th>
              <Th></Th>
            </Tr>
          </THead>
          <TBody>
            {(academies ?? []).map((a) => (
              <Tr key={a.id}>
                <Td className="font-medium">{a.name}</Td>
                <Td dir="ltr">{a.slug}</Td>
                <Td dir="ltr">{a.phone || "—"}</Td>
                <Td dir="ltr">{a.email || "—"}</Td>
                <Td className="text-left">
                  <Link href={`/super-admin/academies/${a.id}`} className="text-primary text-sm hover:underline">إدارة</Link>
                </Td>
              </Tr>
            ))}
            {(academies ?? []).length === 0 && (
              <Tr><Td colSpan={5} className="text-center text-muted-foreground py-8">لا توجد أكاديميات</Td></Tr>
            )}
          </TBody>
        </Table>
      </PageBody>
    </>
  );
}
