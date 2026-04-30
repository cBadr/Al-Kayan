import { PageBody, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  const { data: matches } = await sb
    .from("matches")
    .select("*, match_team_totals(starting_count, bench_count, goals, yellows, reds)")
    .eq("academy_id", academyId)
    .order("match_date", { ascending: false });

  const wins = (matches ?? []).filter((m: any) => m.our_score != null && m.their_score != null && m.our_score > m.their_score).length;
  const losses = (matches ?? []).filter((m: any) => m.our_score != null && m.their_score != null && m.our_score < m.their_score).length;
  const draws = (matches ?? []).filter((m: any) => m.our_score != null && m.their_score != null && m.our_score === m.their_score).length;

  return (
    <>
      <PageHeader
        title="المباريات"
        description="إدارة المباريات وقوائم اللاعبين والتشكيلة على الملعب"
        actions={
          <Button asChild variant="gold">
            <Link href={`/academy/${academyId}/matches/reports`}>📊 التقارير الرياضية</Link>
          </Button>
        }
      />
      <PageBody>
        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <StatBox label="إجمالي" value={String((matches ?? []).length)} />
          <StatBox label="فوز" value={String(wins)} tone="success" />
          <StatBox label="تعادل" value={String(draws)} tone="muted" />
          <StatBox label="خسارة" value={String(losses)} tone="danger" />
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <details>
              <summary className="cursor-pointer font-bold text-emerald-900 mb-3">+ إضافة مباراة جديدة</summary>
              <form
                action={async (fd) => { "use server"; await createMatch(academyId, fd); }}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-4"
              >
                <div className="space-y-1.5"><Label htmlFor="opponent">الخصم *</Label><Input id="opponent" name="opponent" required /></div>
                <div className="space-y-1.5">
                  <Label htmlFor="match_type">نوع المباراة *</Label>
                  <select id="match_type" name="match_type" required defaultValue="home" className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                    <option value="home">داخلي</option>
                    <option value="away">خارجي</option>
                  </select>
                </div>
                <div className="space-y-1.5"><Label htmlFor="venue">الملعب</Label><Input id="venue" name="venue" placeholder="مثل: ملعب نادي السلام" /></div>
                <div className="space-y-1.5"><Label htmlFor="match_date">التاريخ والوقت *</Label><Input id="match_date" name="match_date" type="datetime-local" required /></div>
                <div className="space-y-1.5"><Label htmlFor="duration_min">المدة (د)</Label><Input id="duration_min" name="duration_min" type="number" min="1" defaultValue={90} /></div>
                <div className="space-y-1.5">
                  <Label htmlFor="formation">الخطة</Label>
                  <select id="formation" name="formation" className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm">
                    <option value="">— —</option>
                    <option>4-4-2</option>
                    <option>4-3-3</option>
                    <option>4-2-3-1</option>
                    <option>3-5-2</option>
                    <option>3-4-3</option>
                    <option>5-3-2</option>
                  </select>
                </div>

                <div className="space-y-1.5"><Label htmlFor="our_score">لنا</Label><Input id="our_score" name="our_score" type="number" min="0" /></div>
                <div className="space-y-1.5"><Label htmlFor="their_score">للخصم</Label><Input id="their_score" name="their_score" type="number" min="0" /></div>
                <div className="space-y-1.5 md:col-span-1"></div>

                <div className="md:col-span-3 mt-3">
                  <h4 className="font-semibold text-sm text-emerald-900 mb-2">طاقم التحكيم</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label htmlFor="referee_name">اسم حكم الساحة</Label><Input id="referee_name" name="referee_name" /></div>
                    <div className="space-y-1.5"><Label htmlFor="referee_phone">موبايل حكم الساحة</Label><Input id="referee_phone" name="referee_phone" dir="ltr" /></div>
                    <div className="space-y-1.5"><Label htmlFor="assistant1_name">اسم مساعد الحكم الأول</Label><Input id="assistant1_name" name="assistant1_name" /></div>
                    <div className="space-y-1.5"><Label htmlFor="assistant1_phone">موبايل مساعد الحكم الأول</Label><Input id="assistant1_phone" name="assistant1_phone" dir="ltr" /></div>
                    <div className="space-y-1.5"><Label htmlFor="assistant2_name">اسم مساعد الحكم الثاني</Label><Input id="assistant2_name" name="assistant2_name" /></div>
                    <div className="space-y-1.5"><Label htmlFor="assistant2_phone">موبايل مساعد الحكم الثاني</Label><Input id="assistant2_phone" name="assistant2_phone" dir="ltr" /></div>
                  </div>
                </div>

                <div className="md:col-span-3 space-y-1.5"><Label htmlFor="notes">ملاحظات</Label><Input id="notes" name="notes" /></div>

                <div className="md:col-span-3 flex justify-end"><Button type="submit">حفظ المباراة</Button></div>
              </form>
            </details>
          </CardContent>
        </Card>

        <Table>
          <THead>
            <Tr>
              <Th>التاريخ</Th>
              <Th>الخصم</Th>
              <Th>النوع</Th>
              <Th>الملعب</Th>
              <Th>النتيجة</Th>
              <Th>التشكيلة</Th>
              <Th>البطاقات</Th>
              <Th></Th>
            </Tr>
          </THead>
          <TBody>
            {(matches ?? []).map((m: any) => {
              const totals = Array.isArray(m.match_team_totals) ? m.match_team_totals[0] : m.match_team_totals;
              const result = m.our_score == null ? null
                : m.our_score > m.their_score ? "win"
                : m.our_score < m.their_score ? "loss" : "draw";
              return (
                <Tr key={m.id}>
                  <Td>{formatDate(m.match_date, true)}</Td>
                  <Td className="font-medium">{m.opponent}</Td>
                  <Td>
                    <Badge variant={m.match_type === "home" ? "success" : "muted"}>
                      {m.match_type === "home" ? "داخلي" : "خارجي"}
                    </Badge>
                  </Td>
                  <Td className="text-xs">{m.venue ?? "—"}</Td>
                  <Td className="ltr-numbers">
                    {m.our_score ?? "-"} : {m.their_score ?? "-"}
                    {result && (
                      <Badge className="ms-2" variant={result === "win" ? "success" : result === "loss" ? "destructive" : "muted"}>
                        {result === "win" ? "فوز" : result === "loss" ? "خسارة" : "تعادل"}
                      </Badge>
                    )}
                  </Td>
                  <Td className="text-xs">
                    {(totals?.starting_count ?? 0)}/11 أساسي · {(totals?.bench_count ?? 0)}/9 احتياطي
                  </Td>
                  <Td className="text-xs">
                    🟨 {totals?.yellows ?? 0} · 🟥 {totals?.reds ?? 0}
                  </Td>
                  <Td className="text-left">
                    <Link href={`/academy/${academyId}/matches/${m.id}`} className="text-primary text-sm hover:underline">
                      عرض الملعب →
                    </Link>
                  </Td>
                </Tr>
              );
            })}
            {(matches ?? []).length === 0 && (
              <Tr><Td colSpan={8} className="text-center text-muted-foreground py-8">لا توجد مباريات</Td></Tr>
            )}
          </TBody>
        </Table>
      </PageBody>
    </>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" | "muted" }) {
  const cls = tone === "success" ? "text-emerald-700" : tone === "danger" ? "text-red-600" : tone === "muted" ? "text-muted-foreground" : "text-emerald-900";
  return (
    <div className="rounded-xl bg-white border border-border p-3 text-center">
      <div className={`text-3xl font-black ltr-numbers ${cls}`}>{value}</div>
      <div className="text-xs font-semibold text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
