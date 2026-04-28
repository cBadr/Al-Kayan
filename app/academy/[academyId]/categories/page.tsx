import { PageBody, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { formatCurrency } from "@/lib/utils";
import { createCategory, deleteCategory } from "./actions";

export default async function CategoriesPage({ params }: { params: Promise<{ academyId: string }> }) {
  const { academyId } = await params;
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const { data: cats } = await sb.from("categories").select("*").eq("academy_id", academyId).order("name");

  return (
    <>
      <PageHeader title="التصنيفات" description="ناشئين، براعم، كيدز... مع سعر اشتراك مختلف لكل تصنيف" />
      <PageBody>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form action={async (fd) => { "use server"; await createCategory(academyId, fd); }} className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5 flex-1 min-w-48">
                <Label htmlFor="name">الاسم</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-1.5 w-40">
                <Label htmlFor="monthly_fee">الاشتراك الشهري</Label>
                <Input id="monthly_fee" name="monthly_fee" type="number" min="0" step="0.01" required />
              </div>
              <div className="space-y-1.5 w-28">
                <Label htmlFor="age_min">من سن</Label>
                <Input id="age_min" name="age_min" type="number" min="0" />
              </div>
              <div className="space-y-1.5 w-28">
                <Label htmlFor="age_max">إلى سن</Label>
                <Input id="age_max" name="age_max" type="number" min="0" />
              </div>
              <Button type="submit">إضافة</Button>
            </form>
          </CardContent>
        </Card>

        <Table>
          <THead>
            <Tr><Th>التصنيف</Th><Th>الاشتراك</Th><Th>الفئة العمرية</Th><Th></Th></Tr>
          </THead>
          <TBody>
            {(cats ?? []).map((c: any) => (
              <Tr key={c.id}>
                <Td className="font-medium">{c.name}</Td>
                <Td>{formatCurrency(c.monthly_fee)}</Td>
                <Td>{c.age_min || c.age_max ? `${c.age_min ?? "-"} → ${c.age_max ?? "-"}` : "—"}</Td>
                <Td className="text-left">
                  <form action={async () => { "use server"; await deleteCategory(academyId, c.id); }}>
                    <Button size="sm" variant="ghost" type="submit">حذف</Button>
                  </form>
                </Td>
              </Tr>
            ))}
            {(cats ?? []).length === 0 && (
              <Tr><Td colSpan={4} className="text-center text-muted-foreground py-8">لا توجد تصنيفات بعد</Td></Tr>
            )}
          </TBody>
        </Table>
      </PageBody>
    </>
  );
}
