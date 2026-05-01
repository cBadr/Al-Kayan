import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/rbac";
import { signedUrl } from "@/lib/storage";
import { redirect } from "next/navigation";
import { MePrintable } from "./printable";

export const dynamic = "force-dynamic";

export default async function MePrintPage() {
  const me = await requireUser();
  const sb = await createClient();
  const { data: players } = await sb.from("players")
    .select("*, academies(name, logo_url, address, phone, seal_url, manager_signature_url, manager_name), categories(name, monthly_fee)")
    .eq("user_id", me.id);
  const player = (players ?? [])[0];
  if (!player) redirect("/me");

  const academyId = player.academy_id;
  const photo = await signedUrl(player.photo_url);

  const [
    { data: subs },
    { data: attRecords },
    { data: matchParts },
    { data: discipline },
    { data: attSummary },
    { data: matchSummary },
  ] = await Promise.all([
    sb.from("subscriptions").select("*").eq("player_id", player.id).order("period_start", { ascending: false }),
    sb.from("attendance_records")
      .select("status, recorded_at, trainings!inner(id, scheduled_at, location, categories(name))")
      .eq("player_id", player.id)
      .order("scheduled_at", { ascending: false, referencedTable: "trainings" })
      .limit(50),
    sb.from("match_participations")
      .select("goals, yellow_cards, red_cards, minutes_played, lineup_role, is_captain, matches!inner(id, opponent, match_date, our_score, their_score, match_type, venue)")
      .eq("player_id", player.id)
      .order("match_date", { ascending: false, referencedTable: "matches" })
      .limit(30),
    sb.from("player_discipline").select("*").eq("player_id", player.id).maybeSingle(),
    sb.from("player_attendance_summary").select("*").eq("player_id", player.id).maybeSingle(),
    sb.from("player_match_summary").select("*").eq("player_id", player.id).maybeSingle(),
  ]);

  void academyId;

  return (
    <MePrintable
      player={player as any}
      photoUrl={photo}
      logoUrl={player.academies?.logo_url ?? null}
      sealUrl={(player.academies as any)?.seal_url ?? null}
      signatureUrl={(player.academies as any)?.manager_signature_url ?? null}
      managerName={(player.academies as any)?.manager_name ?? null}
      subs={subs ?? []}
      attRecords={(attRecords ?? []) as any}
      matchParts={(matchParts ?? []) as any}
      discipline={discipline as any}
      attSummary={attSummary as any}
      matchSummary={matchSummary as any}
    />
  );
}
