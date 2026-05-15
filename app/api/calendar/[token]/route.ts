import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildIcs, type IcsEvent } from "@/lib/ics";
import { getIntegrationsSettings } from "@/lib/integrations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Public iCalendar feed for a single user.
 *
 * URL: /api/calendar/{token}
 *
 * Token comes from `profiles.calendar_token` and is the only secret. Anyone
 * holding the URL gets read access — that's intentional, it's how calendar
 * subscriptions work across Google / Apple / Outlook. Users can rotate the
 * token at any time to revoke old subscriptions.
 *
 * Returns events for:
 *   - Player: trainings of their category + their academy's matches
 *   - Coach / Manager: all academy trainings + matches
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!token || token.length < 24) {
    return new NextResponse("Invalid token", { status: 404 });
  }

  // Calendar must be enabled in integrations settings
  const integrations = await getIntegrationsSettings();
  if (!integrations.gcal_enabled) {
    return new NextResponse("Calendar feed is disabled by the administrator", { status: 503 });
  }

  const admin = createAdminClient();

  // Find the user by calendar token
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("calendar_token", token)
    .maybeSingle();
  if (!profile) {
    return new NextResponse("Calendar not found", { status: 404 });
  }

  // Resolve memberships → which academies + role does this user have?
  const { data: memberships } = await admin
    .from("memberships")
    .select("academy_id, role")
    .eq("user_id", profile.id);

  // Super admin has no specific academy — return empty calendar with header.
  // (They can subscribe to academy-specific calendars individually if we expose
  // those later. For now show their first academy if any.)
  const academyIds = (memberships ?? [])
    .filter((m) => m.academy_id)
    .map((m) => m.academy_id as string);
  if (academyIds.length === 0) {
    const ics = buildIcs({
      name: integrations.gcal_default_calendar_name || "تقويم الأكاديمية",
      timezone: "Africa/Cairo",
      events: [],
    });
    return icsResponse(ics);
  }

  // For now: aggregate events from ALL academies this user belongs to (multi-tenant).
  const events: IcsEvent[] = [];
  // Range: 90 days back → 365 days forward (enough for a season)
  const from = new Date(Date.now() - 90 * 86400000).toISOString();
  const to = new Date(Date.now() + 365 * 86400000).toISOString();

  for (const membership of (memberships ?? [])) {
    if (!membership.academy_id) continue;
    const academyId = membership.academy_id;
    const role = membership.role;

    // Fetch academy name once for nicer event titles
    const { data: academy } = await admin.from("academies").select("name").eq("id", academyId).maybeSingle();
    const academyName = academy?.name ?? "الأكاديمية";

    // Player: scope trainings to their category
    let trainingCategoryFilter: string | null = null;
    if (role === "player") {
      const { data: player } = await admin
        .from("players")
        .select("category_id")
        .eq("user_id", profile.id)
        .eq("academy_id", academyId)
        .maybeSingle();
      trainingCategoryFilter = player?.category_id ?? null;
    }

    // Trainings
    let trainingsQ = admin
      .from("trainings")
      .select("id, scheduled_at, duration_min, location, categories(name)")
      .eq("academy_id", academyId)
      .gte("scheduled_at", from)
      .lte("scheduled_at", to)
      .order("scheduled_at");
    if (trainingCategoryFilter) {
      trainingsQ = trainingsQ.eq("category_id", trainingCategoryFilter);
    }
    const { data: trainings } = await trainingsQ;

    for (const t of (trainings ?? []) as any[]) {
      const start = new Date(t.scheduled_at);
      const end = new Date(start.getTime() + (t.duration_min || 90) * 60000);
      const catName = t.categories?.name ?? "تدريب";
      events.push({
        uid: `training-${t.id}@salama`,
        start,
        end,
        summary: `🏃 ${catName}`,
        description: `تدريب — ${academyName}${catName ? ` · ${catName}` : ""}`,
        location: t.location ?? null,
      });
    }

    // Matches
    const { data: matches } = await admin
      .from("matches")
      .select("id, opponent, match_date, duration_min, venue, match_type, our_score, their_score")
      .eq("academy_id", academyId)
      .gte("match_date", from)
      .lte("match_date", to)
      .order("match_date");

    for (const m of (matches ?? []) as any[]) {
      const start = new Date(m.match_date);
      const end = new Date(start.getTime() + (m.duration_min || 90) * 60000);
      const typeIcon = m.match_type === "home" ? "🏠" : "✈️";
      const score = m.our_score != null && m.their_score != null
        ? ` (${m.our_score}-${m.their_score})` : "";
      events.push({
        uid: `match-${m.id}@salama`,
        start,
        end,
        summary: `${typeIcon} ⚽ ${academyName} vs ${m.opponent}${score}`,
        description: `مباراة — ${academyName} ضد ${m.opponent}${score}`,
        location: m.venue ?? null,
      });
    }
  }

  const ics = buildIcs({
    name: integrations.gcal_default_calendar_name || `تقويم — ${profile.full_name ?? "أكاديميتي"}`,
    timezone: "Africa/Cairo",
    events,
    refreshHours: 1,
  });

  return icsResponse(ics);
}

function icsResponse(ics: string): NextResponse {
  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="salama.ics"',
      // Calendars cache aggressively; tell them to refresh hourly
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
