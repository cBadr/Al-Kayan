import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import { signedUrl } from "@/lib/storage";
import { PrintablePlayerProfile } from "./printable";

export const dynamic = "force-dynamic";

export default async function PlayerPrintPage({ params }: { params: Promise<{ academyId: string; playerId: string }> }) {
  const { academyId, playerId } = await params;
  await requireAcademyAccess(academyId);
  const sb = await createClient();

  const [
    { data: p },
    { data: attSummary },
    { data: matchSummary },
    { data: roi },
    { data: injuries },
    { data: subs },
    { data: matchParts },
  ] = await Promise.all([
    sb.from("players").select("*, categories(name, monthly_fee), academies(name, logo_url, address, phone)").eq("id", playerId).maybeSingle(),
    sb.from("player_attendance_summary").select("*").eq("player_id", playerId).maybeSingle(),
    sb.from("player_match_summary").select("*").eq("player_id", playerId).maybeSingle(),
    sb.from("player_roi").select("*").eq("player_id", playerId).maybeSingle(),
    sb.from("injuries").select("*").eq("player_id", playerId).order("occurred_at", { ascending: false }).limit(20),
    sb.from("subscriptions").select("*").eq("player_id", playerId).order("period_start", { ascending: false }).limit(24),
    sb.from("match_participations")
      .select("goals, yellow_cards, red_cards, sent_off, minutes_played, matches!inner(opponent, match_date, our_score, their_score)")
      .eq("player_id", playerId)
      .order("match_date", { ascending: false, referencedTable: "matches" })
      .limit(20),
  ]);

  if (!p) return <p className="p-6">اللاعب غير موجود</p>;
  const photo = await signedUrl(p.photo_url);
  const logo = await signedUrl(p.academies?.logo_url ?? null);

  return (
    <PrintablePlayerProfile
      player={p as any}
      photoUrl={photo}
      logoUrl={logo}
      academyId={academyId}
      attSummary={attSummary as any}
      matchSummary={matchSummary as any}
      roi={roi as any}
      injuries={(injuries ?? []) as any}
      subscriptions={(subs ?? []) as any}
      matchParts={(matchParts ?? []) as any}
    />
  );
}
