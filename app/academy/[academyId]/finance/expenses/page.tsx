import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";
import { addExpense, addExpenseCategory } from "./actions";

export default async function ExpensesPage({ params }: { params: Promise<{ academyId: string }> }) {
  const { academyId } = await params;
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const [{ data: cats }, { data: expenses }] = await Promise.all([
    sb.from("expense_categories").select("*").eq("academy_id", academyId).order("name"),
    sb.from("expenses").select("*, expense_categories(name)").eq("academy_id", academyId).order("spent_at", { ascending: false }),
  ]);

  return (
    <>
      <PageHeader title="المصروفات" description="مرتبات، أدوات، صيانة..." />
      <PageBody>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <h3 className="font-medium mb-3">إضافة مصروف</h3>
              <form action={async (fd) => { "use server"; await addExpense(academyId, fd); }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="space-y-1.5"><Label htmlFor="description">البيان</Label><Input id="description" name="description" required /></div>
                <div className="space-y-1.5"><Label htmlFor="amount">القيمة</Label><Input id="amount" name="amount" type="number" step="0.01" required /></div>
                <div className="space-y-1.5"><Label htmlFor="spent_at">التاريخ</Label><Input id="spent_at" name="spent_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
                <div className="space-y-1.5">
                  <Label htmlFor="category_id">التصنيف</Label>
                  <select id="category_id" name="category_id" className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                    <option value="">— —</option>
                    {(cats ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <Button type="submit" className="md:col-span-4 w-fit">حفظ</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-3">تصنيفات المصروفات</h3>
              <form action={async (fd) => { "use server"; await addExpenseCategory(academyId, fd); }} className="flex gap-2 mb-3">
                <Input name="name" placeholder="اسم التصنيف" required />
                <Button type="submit" size="sm">إضافة</Button>
              </form>
              <ul className="text-sm text-muted-foreground space-y-1">
                {(cats ?? []).map((c: any) => <li key={c.id}>{c.name}</li>)}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Table>
          <THead><Tr><Th>التاريخ</Th><Th>البيان</Th><Th>التصنيف</Th><Th>القيمة</Th></Tr></THead>
          <TBody>
            {(expenses ?? []).map((e: any) => (
              <Tr key={e.id}>
                <Td>{formatDate(e.spent_at)}</Td>
                <Td className="font-medium">{e.description}</Td>
                <Td>{e.expense_categories?.name ?? "—"}</Td>
                <Td>{formatCurrency(e.amount)}</Td>
              </Tr>
            ))}
            {(expenses ?? []).length === 0 && <Tr><Td colSpan={4} className="text-center text-muted-foreground py-8">لا توجد مصروفات</Td></Tr>}
          </TBody>
        </Table>
      </PageBody>
    </>
  );
}
