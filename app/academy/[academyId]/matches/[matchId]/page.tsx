import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import { formatDate } from "@/lib/utils";
import { ParticipationManager } from "./participation-manager";

export default async function MatchDetail({ params }: { params: Promise<{ academyId: string; matchId: string }> }) {
  const { academyId, matchId } = await params;
  await requireAcademyAccess(academyId);
  const sb = await createClient();

  const [{ data: match }, { data: players }, { data: parts }] = await Promise.all([
    sb.from("matches").select("*").eq("id", matchId).maybeSingle(),
    sb.from("players").select("id, code, full_name, category_id, categories(name)").eq("academy_id", academyId).eq("status", "active").order("code"),
    sb.from("match_participations").select("*").eq("match_id", matchId),
  ]);

  if (!match) return <PageBody><p>المباراة غير موجودة</p></PageBody>;

  return (
    <>
      <PageHeader
        title={`مباراة مع ${match.opponent}`}
        description={`${formatDate(match.match_date, true)} • ${match.venue ?? "—"}`}
      />
      <PageBody>
        <Card>
          <CardHeader><CardTitle>المشاركات (يمكن اختيار لاعبين من تصنيفات مختلفة)</CardTitle></CardHeader>
          <CardContent>
            <ParticipationManager
              academyId={academyId}
              matchId={matchId}
              players={(players ?? []) as any}
              participations={(parts ?? []) as any}
            />
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}
