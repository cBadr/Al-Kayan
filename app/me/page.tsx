import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/rbac";
import { LogoutButton } from "@/components/logout-button";
import { BrandLogo } from "@/components/logo";
import { signedUrl } from "@/lib/storage";
import { MeDashboard } from "./me-dashboard";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const me = await requireUser();
  const sb = await createClient();
  const { data: players } = await sb.from("players")
    .select("*, academies(name, logo_url), categories(name, monthly_fee)")
    .eq("user_id", me.id);
  const player = (players ?? [])[0];

  if (!player) {
    return (
      <div className="flex-1 bg-mesh-emerald flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto"><BrandLogo className="w-16 h-16" rounded="rounded-2xl" /></div>
            <p className="text-muted-foreground">لم يتم ربط حسابك بأي لاعب بعد. تواصل مع الأكاديمية.</p>
            <LogoutButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  const photo = await signedUrl(player.photo_url);
  const academyId = player.academy_id;
  const now = new Date().toISOString();

  const [
    { data: subs },
    { data: notifications },
    { data: upcomingTrainings },
    { data: attRecords },
    { data: matchParts },
    { data: upcomingMatches },
    { data: discipline },
    { data: attSummary },
    { data: matchSummary },
    // For ranking — peer stats within same category
    { data: peerStats },
    { data: peerAttendance },
  ] = await Promise.all([
    sb.from("subscriptions").select("*").eq("player_id", player.id).order("period_start", { ascending: false }),
    sb.from("notifications").select("*").eq("recipient_user_id", me.id).order("created_at", { ascending: false }).limit(50),
    sb.from("trainings")
      .select("id, scheduled_at, location, duration_min, categories(name)")
      .eq("academy_id", academyId)
      .eq("category_id", player.category_id)
      .gte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(10),
    sb.from("attendance_records")
      .select("status, recorded_at, trainings!inner(id, scheduled_at, location, categories(name))")
      .eq("player_id", player.id)
      .order("scheduled_at", { ascending: false, referencedTable: "trainings" })
      .limit(50),
    sb.from("match_participations")
      .select("goals, yellow_cards, red_cards, minutes_played, lineup_role, is_captain, matches!inner(id, opponent, match_date, our_score, their_score, match_type, venue)")
      .eq("player_id", player.id)
      .order("match_date", { ascending: false, referencedTable: "matches" })
      .limit(20),
    sb.from("matches")
      .select("id, opponent, match_date, venue, match_type")
      .eq("academy_id", academyId)
      .gte("match_date", now)
      .order("match_date", { ascending: true })
      .limit(5),
    sb.from("player_discipline").select("*").eq("player_id", player.id).maybeSingle(),
    sb.from("player_attendance_summary").select("*").eq("player_id", player.id).maybeSingle(),
    sb.from("player_match_summary").select("*").eq("player_id", player.id).maybeSingle(),
    // Peers: same category within academy
    player.category_id
      ? sb.from("player_match_summary")
        .select("player_id, goals, matches_played, yellow_cards, red_cards")
        .eq("academy_id", academyId)
      : Promise.resolve({ data: [] as any[] }),
    sb.from("player_attendance_summary")
      .select("player_id, attendance_pct, total_records")
      .eq("academy_id", academyId),
  ]);

  // Filter peers to same category (need players list)
  let categoryPeerIds = new Set<string>();
  if (player.category_id) {
    const { data: catPlayers } = await sb.from("players")
      .select("id")
      .eq("academy_id", academyId)
      .eq("category_id", player.category_id)
      .eq("status", "active");
    categoryPeerIds = new Set((catPlayers ?? []).map((p: any) => p.id));
  }

  const myStats = matchSummary;
  const myAtt = attSummary;

  // Compute ranks within category peers
  const peers = (peerStats ?? []).filter((p: any) => categoryPeerIds.has(p.player_id));
  const peerAtt = (peerAttendance ?? []).filter((p: any) => categoryPeerIds.has(p.player_id) && (p.total_records ?? 0) >= 5);

  // Player needs minutes from discipline view since match summary doesn't include minutes
  const { data: peerDiscipline } = await sb.from("player_discipline")
    .select("player_id, total_minutes")
    .eq("academy_id", academyId);
  const peerMinutes = (peerDiscipline ?? []).filter((p: any) => categoryPeerIds.has(p.player_id));

  const goalsRank = rankAmong(peers, (x) => Number(x.goals ?? 0), Number(myStats?.goals ?? 0), player.id);
  const minutesRank = rankAmong(peerMinutes, (x) => Number(x.total_minutes ?? 0), Number(discipline?.total_minutes ?? 0), player.id);
  const attendanceRank = rankAmong(peerAtt, (x) => Number(x.attendance_pct ?? 0), Number(myAtt?.attendance_pct ?? 0), player.id);

  const rank = {
    goalsRank,
    minutesRank,
    attendanceRank,
    total: categoryPeerIds.size,
  };

  // Streaks (using attRecords ordered by training scheduled_at desc)
  const records = ((attRecords ?? []) as any[]).sort((a, b) =>
    new Date(b.trainings?.scheduled_at ?? 0).getTime() - new Date(a.trainings?.scheduled_at ?? 0).getTime()
  );
  let currentPresent = 0;
  for (const r of records) {
    if (r.status === "present" || r.status === "late") currentPresent++;
    else break;
  }
  let longestPresent = 0;
  let cur = 0;
  for (const r of records) {
    if (r.status === "present" || r.status === "late") {
      cur++;
      if (cur > longestPresent) longestPresent = cur;
    } else cur = 0;
  }
  const last10 = records.slice(0, 10);
  const lastNAttendanceRate = last10.length > 0
    ? Math.round(100 * last10.filter((r) => r.status === "present" || r.status === "late").length / last10.length)
    : 0;

  // Achievements
  const achievements = [
    {
      id: "first_match",
      label: "أول مباراة",
      icon: "🏟",
      earned: (matchSummary?.matches_played ?? 0) >= 1,
      description: "شاركت في أول مباراة لك",
    },
    {
      id: "first_goal",
      label: "أول هدف",
      icon: "⚽",
      earned: (matchSummary?.goals ?? 0) >= 1,
      description: "سجَّلت أول هدف لك",
    },
    {
      id: "hat_trick",
      label: "ثلاثية",
      icon: "🎩",
      earned: ((matchParts ?? []) as any[]).some((mp: any) => (mp.goals ?? 0) >= 3),
      description: "سجَّلت 3 أهداف في مباراة واحدة",
    },
    {
      id: "loyalty",
      label: "الالتزام الكامل",
      icon: "💯",
      earned: (attSummary?.attendance_pct ?? 0) >= 95 && (attSummary?.total_records ?? 0) >= 10,
      description: "نسبة حضور 95%+ في 10 تدريبات على الأقل",
    },
    {
      id: "streak_5",
      label: "5 متتالية",
      icon: "🔥",
      earned: longestPresent >= 5,
      description: "5 تدريبات حضور متتالية",
    },
    {
      id: "streak_10",
      label: "10 متتالية",
      icon: "🚀",
      earned: longestPresent >= 10,
      description: "10 تدريبات حضور متتالية",
    },
    {
      id: "captain",
      label: "القائد",
      icon: "©️",
      earned: ((matchParts ?? []) as any[]).some((mp: any) => mp.is_captain),
      description: "ارتديت شارة القيادة في مباراة",
    },
    {
      id: "fair_play",
      label: "اللعب النظيف",
      icon: "🕊",
      earned: (discipline?.matches_called ?? 0) >= 5 && (discipline?.total_yellows ?? 0) === 0 && (discipline?.total_reds ?? 0) === 0,
      description: "5 مباريات بدون أي بطاقة",
    },
    {
      id: "veteran",
      label: "محترف",
      icon: "🎖",
      earned: (matchSummary?.matches_played ?? 0) >= 20,
      description: "20 مباراة في رصيدك",
    },
    {
      id: "scorer",
      label: "هدّاف",
      icon: "🥇",
      earned: (matchSummary?.goals ?? 0) >= 10,
      description: "10 أهداف في رصيدك",
    },
  ];

  return (
    <MeDashboard
      player={player}
      photoUrl={photo}
      subs={subs ?? []}
      notifications={notifications ?? []}
      upcomingTrainings={(upcomingTrainings ?? []) as any}
      upcomingMatches={(upcomingMatches ?? []) as any}
      attRecords={records}
      matchParts={(matchParts ?? []) as any}
      discipline={discipline as any}
      attSummary={attSummary as any}
      matchSummary={matchSummary as any}
      rank={rank}
      achievements={achievements}
      streaks={{ currentPresent, longestPresent, lastNAttendanceRate }}
    />
  );
}

function rankAmong<T>(
  list: T[],
  getValue: (x: T) => number,
  myValue: number,
  myId: string,
): number | null {
  if (list.length === 0) return null;
  // Higher value = better rank
  const sorted = [...list].sort((a, b) => getValue(b) - getValue(a));
  const idx = sorted.findIndex((x: any) => x.player_id === myId);
  if (idx === -1) {
    // Fallback: rank based on value comparison
    const better = list.filter((x) => getValue(x) > myValue).length;
    return better + 1;
  }
  return idx + 1;
}
