import { PageBody, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { createMatch } from "./actions";

export default async function MatchesPage({ params }: { params: Promise<{ academyId: string }> }) {
  const { academyId } = await params;
  await requireAcademyAccess(academyId);
  const sb = await createClient();
  const { data: matches } = await sb.from("matches").select("*").eq("academy_id", academyId).order("match_date", { ascending: false });

  return (
    <>
      <PageHeader title="المباريات" />
      <PageBody>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form action={async (fd) => { "use server"; await createMatch(academyId, fd); }}
                  className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div className="space-y-1.5"><Label htmlFor="opponent">الخصم</Label><Input id="opponent" name="opponent" required /></div>
              <div className="space-y-1.5"><Label htmlFor="venue">الملعب</Label><Input id="venue" name="venue" /></div>
              <div className="space-y-1.5"><Label htmlFor="match_date">التاريخ</Label><Input id="match_date" name="match_date" type="datetime-local" required /></div>
              <div className="space-y-1.5"><Label htmlFor="our_score">لنا</Label><Input id="our_score" name="our_score" type="number" min="0" /></div>
              <div className="space-y-1.5"><Label htmlFor="their_score">للخصم</Label><Input id="their_score" name="their_score" type="number" min="0" /></div>
              <div className="md:col-span-5 flex justify-end"><Button type="submit">إضافة مباراة</Button></div>
            </form>
          </CardContent>
        </Card>

        <Table>
          <THead><Tr><Th>التاريخ</Th><Th>الخصم</Th><Th>النتيجة</Th><Th>الملعب</Th><Th></Th></Tr></THead>
          <TBody>
            {(matches ?? []).map((m: any) => (
              <Tr key={m.id}>
                <Td>{formatDate(m.match_date, true)}</Td>
                <Td className="font-medium">{m.opponent}</Td>
                <Td className="ltr-numbers">{m.our_score ?? "-"} : {m.their_score ?? "-"}</Td>
                <Td>{m.venue ?? "—"}</Td>
                <Td className="text-left"><Link href={`/academy/${academyId}/matches/${m.id}`} className="text-primary text-sm hover:underline">المشاركات</Link></Td>
              </Tr>
            ))}
            {(matches ?? []).length === 0 && <Tr><Td colSpan={5} className="text-center text-muted-foreground py-8">لا توجد مباريات</Td></Tr>}
          </TBody>
        </Table>
      </PageBody>
    </>
  );
}
