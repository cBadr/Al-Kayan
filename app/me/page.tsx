import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import { BrandLogo } from "@/components/logo";
import { signedUrl } from "@/lib/storage";
import { MeProfileForm } from "./profile-form";
import { ChangePasswordForm } from "./password-form";

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

  // Parallel data fetches
  const [
    { data: subs },
    { data: notifications },
    { data: upcomingTrainings },
    { data: pastTrainings },
    { data: attRecords },
    { data: matchParts },
    { data: upcomingMatches },
    { data: discipline },
    { data: attSummary },
    { data: matchSummary },
  ] = await Promise.all([
    sb.from("subscriptions").select("*").eq("player_id", player.id).order("period_start", { ascending: false }),
    sb.from("notifications").select("*").eq("recipient_user_id", me.id).order("created_at", { ascending: false }).limit(20),
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
      .order("recorded_at", { ascending: false })
      .limit(15),
    sb.from("attendance_records").select("status").eq("player_id", player.id),
    sb.from("match_participations")
      .select("goals, yellow_cards, red_cards, minutes_played, lineup_role, is_captain, matches!inner(id, opponent, match_date, our_score, their_score, match_type, venue)")
      .eq("player_id", player.id)
      .order("match_date", { ascending: false, referencedTable: "matches" })
      .limit(15),
    sb.from("matches")
      .select("id, opponent, match_date, venue, match_type")
      .eq("academy_id", academyId)
      .gte("match_date", now)
      .order("match_date", { ascending: true })
      .limit(5),
    sb.from("player_discipline").select("*").eq("player_id", player.id).maybeSingle(),
    sb.from("player_attendance_summary").select("*").eq("player_id", player.id).maybeSingle(),
    sb.from("player_match_summary").select("*").eq("player_id", player.id).maybeSingle(),
  ]);

  const _attRecords = attRecords ?? [];
  void _attRecords; // (kept for potential future use)

  const isSuspended = player.status === "suspended";

  return (
    <div className="flex-1 bg-pitch min-h-screen">
      {/* Hero */}
      <div className="bg-mesh-emerald text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, white 0.5px, transparent 0.5px), radial-gradient(circle at 80% 50%, white 0.5px, transparent 0.5px)",
          backgroundSize: "40px 40px",
        }} />
        <div className="max-w-5xl mx-auto px-6 py-8 relative z-10 flex items-center gap-4 sm:gap-6 flex-wrap">
          <div className="avatar-ring">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-emerald-900 flex items-center justify-center">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl sm:text-5xl text-gold-400 font-black">
                  {player.full_name?.charAt(0)}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-widest text-gold-400 font-bold mb-1">
              {player.academies?.name}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">{player.full_name}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="chip chip-gold">⚽ {player.categories?.name ?? "—"}</span>
              <span className="chip text-white border-white/20 bg-white/10">
                <span className="ltr-numbers">رقم {player.code}</span>
              </span>
              {player.position && (
                <span className="chip text-white border-white/20 bg-white/10">
                  {posLabel(player.position)}
                </span>
              )}
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>

      {/* Suspension banner */}
      {isSuspended && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-4">
          <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 flex items-center gap-3">
            <span className="text-2xl">🚫</span>
            <div>
              <h3 className="font-black text-red-700">حسابك موقوف عن المشاركة</h3>
              <p className="text-xs text-red-700/80">
                {player.suspension_reason?.startsWith("auto:")
                  ? "تم الإيقاف تلقائياً بسبب 3 بطاقات صفراء. تواصل مع إدارة الأكاديمية لإعادة التفعيل."
                  : (player.suspension_reason ?? "تواصل مع إدارة الأكاديمية.")}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="نسبة الحضور" value={`${attSummary?.attendance_pct ?? 0}%`} tone="success" />
          <Stat label="المباريات" value={String(matchSummary?.matches_played ?? 0)} />
          <Stat label="الأهداف" value={String(matchSummary?.goals ?? 0)} tone="success" />
          <Stat
            label="بطاقات صفراء (نشطة)"
            value={`${discipline?.active_yellows ?? 0}/3`}
            tone={(discipline?.active_yellows ?? 0) >= 3 ? "danger" : (discipline?.active_yellows ?? 0) >= 2 ? "warning" : undefined}
          />
        </div>

        {/* Upcoming trainings */}
        <Card>
          <CardHeader><CardTitle>📅 التدريبات القادمة</CardTitle></CardHeader>
          <CardContent>
            {(upcomingTrainings ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد تدريبات مجدولة في الأيام القادمة.</p>
            ) : (
              <ul className="space-y-2">
                {(upcomingTrainings ?? []).map((t: any) => (
                  <li key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/40 border border-emerald-100">
                    <div className="w-12 h-12 rounded-lg bg-emerald-700 text-white flex flex-col items-center justify-center text-[10px] leading-tight font-bold shrink-0">
                      <span className="text-base">{new Date(t.scheduled_at).getDate()}</span>
                      <span className="opacity-80">{new Intl.DateTimeFormat("ar-EG", { month: "short" }).format(new Date(t.scheduled_at))}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{t.categories?.name ?? "تدريب"}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">
                        {new Date(t.scheduled_at).toLocaleString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                        {t.location ? ` • ${t.location}` : ""} • {t.duration_min} د
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Upcoming matches */}
        <Card>
          <CardHeader><CardTitle>⚽ المباريات القادمة</CardTitle></CardHeader>
          <CardContent>
            {(upcomingMatches ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد مباريات مجدولة قادمة.</p>
            ) : (
              <ul className="space-y-2">
                {(upcomingMatches ?? []).map((m: any) => (
                  <li key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50/40 border border-amber-200">
                    <span className="text-2xl shrink-0">{m.match_type === "home" ? "🏠" : "✈️"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">ضد {m.opponent}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">
                        {formatDate(m.match_date, true)}{m.venue ? ` • ${m.venue}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Match history with my stats */}
        <Card>
          <CardHeader><CardTitle>📊 سجل المباريات والأداء</CardTitle></CardHeader>
          <CardContent>
            {(matchParts ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">لم تُسجَّل لك مشاركات في مباريات بعد.</p>
            ) : (
              <Table>
                <THead>
                  <Tr>
                    <Th>التاريخ</Th><Th>الخصم</Th><Th>النتيجة</Th>
                    <Th>الدور</Th><Th>الدقائق</Th><Th>أهداف</Th><Th>بطاقات</Th>
                  </Tr>
                </THead>
                <TBody>
                  {(matchParts as any[]).map((mp, i) => (
                    <Tr key={i}>
                      <Td>{formatDate(mp.matches?.match_date)}</Td>
                      <Td className="font-medium">{mp.matches?.opponent}</Td>
                      <Td className="ltr-numbers">{mp.matches?.our_score ?? "-"} : {mp.matches?.their_score ?? "-"}</Td>
                      <Td>
                        {mp.lineup_role === "starting" && <Badge variant="success">أساسي{mp.is_captain ? " ★" : ""}</Badge>}
                        {mp.lineup_role === "bench" && <Badge variant="muted">احتياطي</Badge>}
                        {mp.lineup_role === "unused" && <Badge variant="muted">لم يشارك</Badge>}
                      </Td>
                      <Td className="ltr-numbers">{mp.minutes_played ?? 0}</Td>
                      <Td className="font-bold text-emerald-700">{mp.goals ?? 0}</Td>
                      <Td>
                        {mp.yellow_cards > 0 && <Badge variant="warning">🟨{mp.yellow_cards}</Badge>}
                        {mp.red_cards > 0 && <Badge variant="destructive">🟥</Badge>}
                        {!mp.yellow_cards && !mp.red_cards && <span className="text-muted-foreground">—</span>}
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent attendance */}
        <Card>
          <CardHeader><CardTitle>🕐 سجل الحضور (الأحدث)</CardTitle></CardHeader>
          <CardContent>
            {((attRecords ?? []) as any[]).length === 0 ? (
              <p className="text-sm text-muted-foreground">لا يوجد سجل حضور بعد.</p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {((attRecords ?? []) as any[]).map((r, i) => (
                  <li key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/30 text-sm">
                    {r.status === "present" && <Badge variant="success">حاضر</Badge>}
                    {r.status === "absent" && <Badge variant="destructive">غائب</Badge>}
                    {r.status === "late" && <Badge variant="warning">متأخر</Badge>}
                    {r.status === "excused" && <Badge variant="muted">بعذر</Badge>}
                    <span className="text-xs flex-1 truncate" dir="ltr">
                      {formatDate(r.trainings?.scheduled_at)} {r.trainings?.location ? `· ${r.trainings.location}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Subscriptions */}
        <Card>
          <CardHeader><CardTitle>💳 إيصالات السداد</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead><Tr><Th>الفترة</Th><Th>المستحق</Th><Th>المتبقي</Th><Th>الحالة</Th></Tr></THead>
              <TBody>
                {(subs ?? []).map((s: any) => (
                  <Tr key={s.id}>
                    <Td className="text-xs">{formatDate(s.period_start)} → {formatDate(s.period_end)}</Td>
                    <Td>{formatCurrency(s.amount_due)}</Td>
                    <Td>{formatCurrency(Number(s.amount_due) - Number(s.amount_paid))}</Td>
                    <Td><Badge variant={s.status === "paid" ? "success" : s.status === "partial" ? "warning" : "destructive"}>
                      {s.status === "paid" ? "مدفوع" : s.status === "partial" ? "جزئي" : "غير مدفوع"}
                    </Badge></Td>
                  </Tr>
                ))}
                {(subs ?? []).length === 0 && <Tr><Td colSpan={4} className="text-center py-4 text-muted-foreground">لا توجد إيصالات</Td></Tr>}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader><CardTitle>🔔 الإشعارات</CardTitle></CardHeader>
          <CardContent>
            {(notifications ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">لا توجد إشعارات</p>
            ) : (
              <ul className="space-y-3">
                {(notifications ?? []).map((n: any) => (
                  <li key={n.id} className="border-b border-border pb-3 last:border-0">
                    <div className="flex justify-between gap-2 items-start">
                      <span className="font-semibold text-emerald-950">{n.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{formatDate(n.created_at, true)}</span>
                    </div>
                    {n.body && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{n.body}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Edit profile + change password — side by side on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>✏️ تحديث بياناتي</CardTitle></CardHeader>
            <CardContent>
              <MeProfileForm
                playerId={player.id}
                defaults={{
                  phone: player.phone ?? "",
                  email: player.email ?? "",
                  guardian_name: player.guardian_name ?? "",
                  guardian_phone: player.guardian_phone ?? "",
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>🔐 تغيير كلمة المرور</CardTitle></CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" | "danger" }) {
  const cls = tone === "success" ? "text-emerald-700"
    : tone === "warning" ? "text-amber-600"
    : tone === "danger" ? "text-red-600"
    : "text-emerald-900";
  return (
    <div className="rounded-xl bg-white border border-border p-3 text-center">
      <div className={`text-2xl font-black ltr-numbers ${cls}`}>{value}</div>
      <div className="text-[11px] font-semibold text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function posLabel(p: string | null) {
  if (!p) return "";
  return ({ GK: "حارس", DF: "دفاع", MF: "وسط", FW: "هجوم" } as any)[p] ?? p;
}
