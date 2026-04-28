import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import { CompareChart } from "./compare-chart";

export default async function ComparePage({ params, searchParams }: {
  params: Promise<{ academyId: string }>;
  searchParams: Promise<{ ids?: string }>;
}) {
  const { academyId } = await params;
  const sp = await searchParams;
  await requireAcademyAccess(academyId);
  const sb = await createClient();

  const ids = (sp.ids ?? "").split(",").filter(Boolean);
  const { data: allPlayers } = await sb
    .from("players")
    .select("id, code, full_name")
    .eq("academy_id", academyId)
    .eq("status", "active")
    .order("code");

  let stats: any[] = [];
  if (ids.length > 0) {
    const [{ data: att }, { data: matches }] = await Promise.all([
      sb.from("player_attendance_summary").select("*").in("player_id", ids),
      sb.from("player_match_summary").select("*").in("player_id", ids),
    ]);
    stats = (att ?? []).map((a: any) => ({
      ...a,
      ...((matches ?? []).find((m: any) => m.player_id === a.player_id) ?? {}),
    }));
  }

  return (
    <>
      <PageHeader title="مقارنة بين لاعبين" description="اختر لاعبين أو أكثر للمقارنة" />
      <PageBody>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form>
              <label className="block text-sm font-medium mb-2">اللاعبون (Ctrl/Cmd للاختيار المتعدد)</label>
              <select name="ids" multiple defaultValue={ids} className="w-full min-h-48 rounded-md border border-border bg-card px-3 py-2 text-sm"
                onChange={(e) => {
                  const v = Array.from(e.currentTarget.selectedOptions).map((o) => o.value).join(",");
                  const url = new URL(window.location.href);
                  url.searchParams.set("ids", v);
                  window.location.href = url.toString();
                }}>
                {(allPlayers ?? []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.code} — {p.full_name}</option>
                ))}
              </select>
            </form>
          </CardContent>
        </Card>

        {stats.length >= 2 && <CompareChart data={stats} />}
        {stats.length === 1 && <p className="text-muted-foreground">اختر لاعبين على الأقل للمقارنة</p>}
      </PageBody>
    </>
  );
}
