import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import { signedUrl } from "@/lib/storage";
import { ReportsPrintable } from "./printable";

export const dynamic = "force-dynamic";

export default async function ReportsPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ academyId: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    position?: string;
    from?: string;
    to?: string;
    view?: "summary" | "discipline" | "minutes" | "all";
    player?: string;
  }>;
}) {
  const { academyId } = await params;
  const sp = await searchParams;
  await requireAcademyAccess(academyId);
  const sb = await createClient();

  const [
    { data: academy },
    { data: categories },
    { data: playersRaw },
    { data: discipline },
    { data: matchSummary },
    { data: attSummary },
  ] = await Promise.all([
    sb.from("academies").select("name, logo_url, address, phone").eq("id", academyId).maybeSingle(),
    sb.from("categories").select("id, name").eq("academy_id", academyId),
    sb.from("players")
      .select("id, code, full_name, position, status, category_id, suspension_reason, categories(name)")
      .eq("academy_id", academyId)
      .order("full_name"),
    sb.from("player_discipline").select("*").eq("academy_id", academyId),
    sb.from("player_match_summary").select("*").eq("academy_id", academyId),
    sb.from("player_attendance_summary").select("*").eq("academy_id", academyId),
  ]);

  // Apply filters
  let players = playersRaw ?? [];
  if (sp.player) players = players.filter((p) => p.id === sp.player);
  if (sp.q) {
    const q = sp.q.toLowerCase();
    players = players.filter((p) =>
      p.full_name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
    );
  }
  if (sp.category) players = players.filter((p) => p.category_id === sp.category);
  if (sp.status) players = players.filter((p) => p.status === sp.status);
  if (sp.position) players = players.filter((p) => p.position === sp.position);

  // Match list (for matrix)
  let matchQ = sb.from("matches")
    .select("id, opponent, match_date, our_score, their_score, match_type")
    .eq("academy_id", academyId)
    .order("match_date", { ascending: true });
  if (sp.from) matchQ = matchQ.gte("match_date", sp.from);
  if (sp.to) matchQ = matchQ.lte("match_date", `${sp.to}T23:59:59`);
  const { data: matches } = await matchQ;

  // Participations
  const playerIds = players.map((p) => p.id);
  const matchIds = (matches ?? []).map((m) => m.id);
  let parts: any[] = [];
  if (playerIds.length > 0 && matchIds.length > 0) {
    const { data } = await sb.from("match_participations")
      .select("match_id, player_id, lineup_role, minutes_played, goals, yellow_cards, red_cards, sent_off")
      .in("player_id", playerIds)
      .in("match_id", matchIds);
    parts = data ?? [];
  }

  const view = sp.view ?? "all";
  const logoUrl = await signedUrl(academy?.logo_url ?? null);

  // Build human-readable filter description
  const categoryName = sp.category ? (categories ?? []).find((c) => c.id === sp.category)?.name : null;
  const statusLabel = sp.status === "active" ? "نشط" : sp.status === "suspended" ? "موقوف" : sp.status === "archived" ? "مؤرشف" : null;
  const positionLabel = sp.position === "GK" ? "حارس" : sp.position === "DF" ? "دفاع" : sp.position === "MF" ? "وسط" : sp.position === "FW" ? "هجوم" : null;
  const filters = [
    sp.q && `بحث: "${sp.q}"`,
    categoryName && `التصنيف: ${categoryName}`,
    statusLabel && `الحالة: ${statusLabel}`,
    positionLabel && `المركز: ${positionLabel}`,
    sp.from && `من: ${sp.from}`,
    sp.to && `إلى: ${sp.to}`,
    sp.player && `لاعب محدد`,
  ].filter(Boolean) as string[];

  return (
    <ReportsPrintable
      academyName={academy?.name ?? ""}
      academyAddress={academy?.address ?? null}
      academyPhone={academy?.phone ?? null}
      logoUrl={logoUrl}
      players={players as any}
      matches={(matches ?? []) as any}
      parts={parts}
      discipline={Object.fromEntries((discipline ?? []).map((d: any) => [d.player_id, d]))}
      matchSummary={Object.fromEntries((matchSummary ?? []).map((m: any) => [m.player_id, m]))}
      attSummary={Object.fromEntries((attSummary ?? []).map((a: any) => [a.player_id, a]))}
      filters={filters}
      view={view}
      academyId={academyId}
    />
  );
}
