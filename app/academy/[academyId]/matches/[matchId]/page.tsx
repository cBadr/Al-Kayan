import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import { formatDate } from "@/lib/utils";
import { LineupEditor } from "./lineup-editor";
import { ParticipationManager } from "./participation-manager";
import Link from "next/link";

export default async function MatchDetail({ params }: { params: Promise<{ academyId: string; matchId: string }> }) {
  const { academyId, matchId } = await params;
  await requireAcademyAccess(academyId);
  const sb = await createClient();

  const [{ data: match }, { data: players }, { data: parts }] = await Promise.all([
    sb.from("matches").select("*").eq("id", matchId).maybeSingle(),
    sb.from("players")
      .select("id, code, full_name, position, preferred_jersey, photo_url, category_id, categories(name)")
      .eq("academy_id", academyId)
      .eq("status", "active")
      .order("preferred_jersey", { nullsFirst: false }),
    sb.from("match_participations").select("*").eq("match_id", matchId),
  ]);

  if (!match) return <PageBody><p>المباراة غير موجودة</p></PageBody>;

  const result = match.our_score == null ? null
    : match.our_score > match.their_score ? "win"
    : match.our_score < match.their_score ? "loss" : "draw";

  return (
    <>
      <PageHeader
        title={`${match.match_type === "home" ? "🏠" : "✈️"} ${match.opponent}`}
        description={`${formatDate(match.match_date, true)} • ${match.venue ?? "—"}`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/academy/${academyId}/matches`}>← العودة للقائمة</Link>
          </Button>
        }
      />
      <PageBody>
        {/* Match summary banner */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">نحن</div>
                <div className="text-5xl font-black text-emerald-700 ltr-numbers mt-2">{match.our_score ?? "—"}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">{match.match_type === "home" ? "مباراة داخلية" : "مباراة خارجية"}</div>
                <div className="text-2xl font-bold text-emerald-950">VS</div>
                {result && (
                  <Badge variant={result === "win" ? "success" : result === "loss" ? "destructive" : "muted"} className="mt-2">
                    {result === "win" ? "فوز" : result === "loss" ? "خسارة" : "تعادل"}
                  </Badge>
                )}
                {match.formation && (
                  <div className="text-xs text-muted-foreground mt-1">الخطة: {match.formation}</div>
                )}
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">{match.opponent}</div>
                <div className="text-5xl font-black text-emerald-900 ltr-numbers mt-2">{match.their_score ?? "—"}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 text-xs text-muted-foreground border-t border-border pt-4">
              <Info k="التاريخ" v={formatDate(match.match_date, true)} />
              <Info k="المدة" v={`${match.duration_min ?? 90} دقيقة`} />
              <Info k="الملعب" v={match.venue ?? "—"} />
              <Info k="نوع المباراة" v={match.match_type === "home" ? "داخلي" : "خارجي"} />
            </div>
          </CardContent>
        </Card>

        {/* Referee crew */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">طاقم التحكيم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <RefCard role="حكم الساحة" name={match.referee_name} phone={match.referee_phone} />
              <RefCard role="مساعد الحكم الأول" name={match.assistant1_name} phone={match.assistant1_phone} />
              <RefCard role="مساعد الحكم الثاني" name={match.assistant2_name} phone={match.assistant2_phone} />
              <RefCard role="مراقب المباراة" name={match.observer_name} phone={match.observer_phone} />
            </div>
          </CardContent>
        </Card>

        {/* Lineup editor (pitch view) */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">التشكيلة على الملعب</CardTitle>
          </CardHeader>
          <CardContent>
            <LineupEditor
              academyId={academyId}
              matchId={matchId}
              players={(players ?? []) as any}
              participations={(parts ?? []) as any}
              defaultFormation={match.formation}
            />
          </CardContent>
        </Card>

        {/* Stats per participant (cards/goals/minutes/injuries) */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">إحصائيات اللاعبين (أهداف · دقائق · بطاقات · إصابات)</CardTitle>
          </CardHeader>
          <CardContent>
            <ParticipationManager
              academyId={academyId}
              matchId={matchId}
              players={(players ?? []) as any}
              participations={(parts ?? []) as any}
            />
          </CardContent>
        </Card>

        {match.notes && (
          <Card>
            <CardHeader><CardTitle className="text-base">ملاحظات</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line">{match.notes}</p>
            </CardContent>
          </Card>
        )}
      </PageBody>
    </>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-semibold">{k}</div>
      <div className="text-sm text-emerald-950 font-medium mt-0.5">{v}</div>
    </div>
  );
}

function RefCard({ role, name, phone }: { role: string; name: string | null; phone: string | null }) {
  return (
    <div className="rounded-lg border border-border bg-emerald-50/40 p-3">
      <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">{role}</div>
      <div className="font-semibold mt-1">{name || "— لم يُحدَّد —"}</div>
      {phone ? (
        <a href={`tel:${phone}`} className="text-xs text-emerald-700 hover:underline mt-1 block" dir="ltr">
          📞 {phone}
        </a>
      ) : (
        <div className="text-xs text-muted-foreground mt-1">—</div>
      )}
    </div>
  );
}
