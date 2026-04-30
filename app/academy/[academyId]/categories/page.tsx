import { PageBody, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, THead, Th, Tr, Td } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { createCategory, deleteCategory, updateCategory, toggleCategoryActive } from "./actions";
import { CategoryRow } from "./category-row";

export default async function CategoriesPage({ params }: { params: Promise<{ academyId: string }> }) {
  const { academyId } = await params;
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const { data: cats } = await sb.from("categories").select("*").eq("academy_id", academyId).order("name");

  async function updateAction(id: string, fd: FormData) {
    "use server";
    return await updateCategory(academyId, id, fd);
  }
  async function deleteAction(id: string) {
    "use server";
    return await deleteCategory(academyId, id);
  }
  async function toggleAction(id: string, active: boolean) {
    "use server";
    await toggleCategoryActive(academyId, id, active);
  }

  return (
    <>
      <PageHeader title="التقسيمات" description="ناشئين، براعم، كيدز... مع سعر اشتراك مختلف لكل تصنيف" />
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
            <Tr>
              <Th>التصنيف</Th>
              <Th>الاشتراك</Th>
              <Th>الفئة العمرية</Th>
              <Th>الحالة</Th>
              <Th className="text-left">إدارة</Th>
            </Tr>
          </THead>
          <TBody>
            {(cats ?? []).map((c: any) => (
              <CategoryRow
                key={c.id}
                cat={c}
                onUpdate={updateAction}
                onDelete={deleteAction}
                onToggle={toggleAction}
              />
            ))}
            {(cats ?? []).length === 0 && (
              <Tr><Td colSpan={5} className="text-center text-muted-foreground py-8">لا توجد تصنيفات بعد</Td></Tr>
            )}
          </TBody>
        </Table>
      </PageBody>
    </>
  );
}
