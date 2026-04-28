import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { PrintExport } from "@/components/print-export";

export default async function ReportsPage({ params, searchParams }: {
  params: Promise<{ academyId: string }>;
  searchParams: Promise<{ from?: string; to?: string; players?: string }>;
}) {
  const { academyId } = await params;
  const sp = await searchParams;
  await requireAcademyAccess(academyId);
  const sb = await createClient();

  const { data: rows } = await sb
    .from("player_attendance_summary")
    .select("*, player_match_summary!inner(goals,yellow_cards,red_cards,matches_played), player_roi!inner(monthly_fee, attended_hours)")
    .eq("academy_id", academyId);

  const flat = (rows ?? []).map((r: any) => ({
    code: r.code,
    name: r.full_name,
    attendance_pct: r.attendance_pct,
    present: r.present_count,
    absent: r.absent_count,
    late: r.late_count,
    matches: r.player_match_summary?.matches_played ?? 0,
    goals: r.player_match_summary?.goals ?? 0,
    yellow: r.player_match_summary?.yellow_cards ?? 0,
    red: r.player_match_summary?.red_cards ?? 0,
    monthly_fee: r.player_roi?.monthly_fee ?? 0,
    hours: Number(r.player_roi?.attended_hours ?? 0),
  }));

  return (
    <>
      <PageHeader
        title="تقارير اللاعبين"
        description="نسبة الحضور، الأهداف، الإنذارات، ROI"
        actions={<>
          <Button asChild variant="outline"><Link href={`/academy/${academyId}/reports/compare`}>مقارنة بين لاعبين</Link></Button>
          <PrintExport tableId="reports-table" filename={`reports-${academyId}`} />
        </>}
      />
      <PageBody>
        <Card>
          <CardHeader><CardTitle>التقرير العام</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>الكود</Th><Th>الاسم</Th><Th>الحضور %</Th><Th>حضور</Th><Th>غياب</Th><Th>تأخير</Th>
                  <Th>مباريات</Th><Th>أهداف</Th><Th>صفراء</Th><Th>حمراء</Th><Th>اشتراك</Th><Th>ساعات الحضور</Th>
                </Tr>
              </THead>
              <TBody>
                {flat.map((r) => (
                  <Tr key={r.code}>
                    <Td className="ltr-numbers font-mono">{r.code}</Td>
                    <Td className="font-medium">{r.name}</Td>
                    <Td>{r.attendance_pct}%</Td>
                    <Td>{r.present}</Td>
                    <Td>{r.absent}</Td>
                    <Td>{r.late}</Td>
                    <Td>{r.matches}</Td>
                    <Td>{r.goals}</Td>
                    <Td>{r.yellow}</Td>
                    <Td>{r.red}</Td>
                    <Td>{formatCurrency(r.monthly_fee)}</Td>
                    <Td>{Math.round(r.hours * 100) / 100}</Td>
                  </Tr>
                ))}
                {flat.length === 0 && <Tr><Td colSpan={12} className="text-center text-muted-foreground py-6">لا توجد بيانات</Td></Tr>}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}
