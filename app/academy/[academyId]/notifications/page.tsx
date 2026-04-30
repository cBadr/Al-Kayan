import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { formatDate } from "@/lib/utils";
import { sendNotification } from "./actions";
import { NotificationComposer } from "./notification-composer";

export default async function NotificationsPage({ params }: { params: Promise<{ academyId: string }> }) {
  const { academyId } = await params;
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const [{ data: cats }, { data: players }, { data: notifications }] = await Promise.all([
    sb.from("categories").select("id, name").eq("academy_id", academyId),
    sb.from("players").select("id, full_name, code").eq("academy_id", academyId).eq("status", "active").order("full_name"),
    sb.from("notifications")
      .select("*")
      .eq("academy_id", academyId)
      .is("recipient_user_id", null)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  async function action(fd: FormData) {
    "use server";
    await sendNotification(academyId, fd);
  }

  return (
    <>
      <PageHeader title="الإشعارات" description="إرسال إشعارات للاعبين عبر التطبيق والبريد الإلكتروني" />
      <PageBody>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <NotificationComposer
              action={action}
              categories={cats ?? []}
              players={players ?? []}
            />
          </CardContent>
        </Card>

        <Table>
          <THead><Tr><Th>التاريخ</Th><Th>العنوان</Th><Th>القناة</Th><Th>الحالة</Th><Th>المستهدفون</Th></Tr></THead>
          <TBody>
            {(notifications ?? []).map((n: any) => (
              <Tr key={n.id}>
                <Td>{formatDate(n.created_at, true)}</Td>
                <Td className="font-medium">{n.title}</Td>
                <Td>{n.channel === "email" ? "بريد" : n.channel === "whatsapp" ? "واتساب" : "داخل النظام"}</Td>
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
