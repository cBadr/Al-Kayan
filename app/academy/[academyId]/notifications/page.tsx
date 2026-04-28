import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { formatDate } from "@/lib/utils";
import { sendNotification } from "./actions";

export default async function NotificationsPage({ params }: { params: Promise<{ academyId: string }> }) {
  const { academyId } = await params;
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const [{ data: cats }, { data: notifications }] = await Promise.all([
    sb.from("categories").select("id, name").eq("academy_id", academyId),
    sb.from("notifications")
      .select("*")
      .eq("academy_id", academyId)
      .is("recipient_user_id", null)  // فقط الـ broadcasts (صف واحد لكل إرسال)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <>
      <PageHeader title="الإشعارات" description="إرسال إشعارات للاعبين عبر التطبيق والبريد الإلكتروني" />
      <PageBody>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form action={async (fd) => { "use server"; await sendNotification(academyId, fd); }} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="audience">المستهدفون</Label>
                  <select id="audience" name="audience" className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                    <option value="all">كل لاعبي الأكاديمية</option>
                    {(cats ?? []).map((c: any) => (
                      <option key={c.id} value={`category:${c.id}`}>تصنيف: {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="channel">القناة</Label>
                  <select id="channel" name="channel" className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm">
                    <option value="in_app">داخل النظام</option>
                    <option value="email">بريد إلكتروني</option>
                    <option value="whatsapp">واتساب</option>
                  </select>
                </div>
                <div className="space-y-1.5"><Label htmlFor="title">العنوان</Label><Input id="title" name="title" required /></div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="body">المحتوى</Label>
                <textarea id="body" name="body" rows={4} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
              </div>
              <Button type="submit">إرسال</Button>
            </form>
          </CardContent>
        </Card>

        <Table>
          <THead><Tr><Th>التاريخ</Th><Th>العنوان</Th><Th>القناة</Th><Th>الحالة</Th><Th>المستهدفون</Th></Tr></THead>
          <TBody>
            {(notifications ?? []).map((n: any) => (
              <Tr key={n.id}>
                <Td>{formatDate(n.created_at, true)}</Td>
                <Td className="font-medium">{n.title}</Td>
                <Td>{n.channel === "email" ? "بريد" : "داخل النظام"}</Td>
                <Td>{n.status}</Td>
                <Td>{n.recipient_group ?? "—"}</Td>
              </Tr>
            ))}
            {(notifications ?? []).length === 0 && <Tr><Td colSpan={5} className="text-center text-muted-foreground py-8">لا توجد إشعارات</Td></Tr>}
          </TBody>
        </Table>
      </PageBody>
    </>
  );
}
