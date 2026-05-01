"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { LogoutButton } from "@/components/logout-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MeProfileForm } from "./profile-form";
import { ChangePasswordForm } from "./password-form";

type Section =
  | "overview"
  | "performance"
  | "schedule"
  | "matches"
  | "attendance"
  | "discipline"
  | "finance"
  | "notifications"
  | "settings";

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: "overview",      label: "اللوحة الرئيسية", icon: "🏠" },
  { key: "performance",   label: "الأداء والتحليلات", icon: "📈" },
  { key: "schedule",      label: "الجدول والقادم",   icon: "📅" },
  { key: "matches",       label: "سجل المباريات",    icon: "⚽" },
  { key: "attendance",    label: "سجل الحضور",       icon: "🕐" },
  { key: "discipline",    label: "اللعب النظيف",     icon: "🟨" },
  { key: "finance",       label: "الاشتراكات",       icon: "💳" },
  { key: "notifications", label: "الإشعارات",        icon: "🔔" },
  { key: "settings",      label: "إعدادات الحساب",   icon: "⚙️" },
];

export function MeDashboard(props: {
  player: any;
  photoUrl: string | null;
  subs: any[];
  notifications: any[];
  upcomingTrainings: any[];
  upcomingMatches: any[];
  attRecords: any[];
  matchParts: any[];
  discipline: any;
  attSummary: any;
  matchSummary: any;
  rank: { goalsRank: number | null; minutesRank: number | null; attendanceRank: number | null; total: number };
  achievements: { id: string; label: string; icon: string; earned: boolean; description: string }[];
  streaks: { currentPresent: number; longestPresent: number; lastNAttendanceRate: number };
}) {
  const {
    player, photoUrl, subs, notifications, upcomingTrainings, upcomingMatches,
    attRecords, matchParts, discipline, attSummary, matchSummary,
    rank, achievements, streaks,
  } = props;

  const [section, setSection] = useState<Section>("overview");

  return (
    <div className="flex-1 bg-pitch min-h-screen">
      <Hero player={player} photoUrl={photoUrl} discipline={discipline} attSummary={attSummary} matchSummary={matchSummary} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 lg:gap-6">
        {/* Side nav */}
        <aside className="lg:sticky lg:top-4 lg:self-start no-print">
          <div className="bg-white rounded-2xl border border-border p-2 shadow-sm">
            <ul className="space-y-1">
              {SECTIONS.map((s) => {
                const isActive = section === s.key;
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => setSection(s.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-right ${
                        isActive
                          ? "bg-emerald-700 text-white font-bold shadow-sm"
                          : "text-emerald-950 hover:bg-emerald-50"
                      }`}
                    >
                      <span className="text-lg shrink-0">{s.icon}</span>
                      <span className="flex-1">{s.label}</span>
                      {s.key === "notifications" && notifications.length > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 rounded-full ${
                          isActive ? "bg-white text-emerald-700" : "bg-amber-400 text-emerald-950"
                        }`}>
                          {notifications.length}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-border mt-2 pt-2 px-1 space-y-2">
              <Link
                href="/me/print"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-emerald-950 hover:bg-emerald-50 transition-colors"
              >
                <span className="text-lg">🖨</span>
                <span>طباعة الملف</span>
              </Link>
              <div className="px-1">
                <LogoutButton />
              </div>
            </div>
          </div>
        </aside>

        {/* Section content */}
        <main className="min-w-0 space-y-5">
          {section === "overview" && (
            <OverviewSection
              attSummary={attSummary} matchSummary={matchSummary} discipline={discipline}
              rank={rank} achievements={achievements} streaks={streaks}
              upcomingTrainings={upcomingTrainings} upcomingMatches={upcomingMatches}
              player={player}
            />
          )}
          {section === "performance" && (
            <PerformanceSection
              attSummary={attSummary} matchSummary={matchSummary} discipline={discipline}
              rank={rank} streaks={streaks} matchParts={matchParts}
            />
          )}
          {section === "schedule" && (
            <ScheduleSection upcomingTrainings={upcomingTrainings} upcomingMatches={upcomingMatches} />
          )}
          {section === "matches" && (
            <MatchesSection matchParts={matchParts} matchSummary={matchSummary} />
          )}
          {section === "attendance" && (
            <AttendanceSection attRecords={attRecords} attSummary={attSummary} streaks={streaks} />
          )}
          {section === "discipline" && (
            <DisciplineSection discipline={discipline} player={player} />
          )}
          {section === "finance" && (
            <FinanceSection subs={subs} />
          )}
          {section === "notifications" && (
            <NotificationsSection notifications={notifications} />
          )}
          {section === "settings" && (
            <SettingsSection player={player} />
          )}
        </main>
      </div>
    </div>
  );
}

/* ============================================================================
   HERO
   ========================================================================= */
function Hero({ player, photoUrl, discipline, attSummary, matchSummary }: any) {
  const greeting = greetingFor(player.full_name);
  const isSuspended = player.status === "suspended";

  return (
    <div className="bg-mesh-emerald text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "radial-gradient(circle at 20% 50%, white 0.5px, transparent 0.5px), radial-gradient(circle at 80% 50%, white 0.5px, transparent 0.5px)",
        backgroundSize: "40px 40px",
      }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="avatar-ring shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-emerald-900 flex items-center justify-center">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl sm:text-4xl text-gold-400 font-black">{player.full_name?.charAt(0)}</span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-widest text-gold-400 font-bold mb-1">
              {player.academies?.name}
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white truncate">{greeting}</h1>
            <p className="text-sm text-white/70 mt-0.5">
              {motivationalLine(attSummary, matchSummary)}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="chip chip-gold">⚽ {player.categories?.name ?? "—"}</span>
              <span className="chip text-white border-white/20 bg-white/10">
                <span className="ltr-numbers">رقم {player.code}</span>
              </span>
              {player.position && (
                <span className="chip text-white border-white/20 bg-white/10">{posLabel(player.position)}</span>
              )}
              {player.preferred_jersey && (
                <span className="chip text-white border-white/20 bg-white/10 ltr-numbers">قميص #{player.preferred_jersey}</span>
              )}
            </div>
          </div>
        </div>

        {isSuspended && (
          <div className="mt-4 rounded-xl border-2 border-red-300/40 bg-red-500/15 backdrop-blur-sm p-3 flex items-center gap-3">
            <span className="text-2xl">🚫</span>
            <div>
              <div className="font-black text-white">حسابك موقوف عن المشاركة</div>
              <div className="text-xs text-white/80">
                {player.suspension_reason?.startsWith("auto:")
                  ? `بسبب ${discipline?.active_yellows ?? 3} بطاقات صفراء — تواصل مع الإدارة لإعادة التفعيل.`
                  : (player.suspension_reason ?? "تواصل مع إدارة الأكاديمية.")}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   OVERVIEW SECTION — motivational dashboard
   ========================================================================= */
function OverviewSection({
  attSummary, matchSummary, discipline, rank, achievements, streaks,
  upcomingTrainings, upcomingMatches, player,
}: any) {
  const nextTraining = upcomingTrainings[0];
  const nextMatch = upcomingMatches[0];
  const earnedCount = achievements.filter((a: any) => a.earned).length;

  return (
    <>
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          label="نسبة الحضور"
          value={`${attSummary?.attendance_pct ?? 0}%`}
          icon="✅"
          tone={(attSummary?.attendance_pct ?? 0) >= 90 ? "success" : (attSummary?.attendance_pct ?? 0) >= 75 ? "warning" : "danger"}
          progress={attSummary?.attendance_pct ?? 0}
        />
        <Stat
          label="الأهداف"
          value={String(matchSummary?.goals ?? 0)}
          icon="⚽"
          tone="success"
          subtitle={rank.goalsRank ? `#${rank.goalsRank} في الفئة` : undefined}
        />
        <Stat
          label="مباريات لُعبت"
          value={String(matchSummary?.matches_played ?? 0)}
          icon="🏟"
          subtitle={rank.minutesRank ? `#${rank.minutesRank} في الدقائق` : undefined}
        />
        <Stat
          label="بطاقات صفراء (نشطة)"
          value={`${discipline?.active_yellows ?? 0}/3`}
          icon="🟨"
          tone={(discipline?.active_yellows ?? 0) >= 3 ? "danger" : (discipline?.active_yellows ?? 0) >= 2 ? "warning" : "success"}
          progress={((discipline?.active_yellows ?? 0) / 3) * 100}
        />
      </div>

      {/* Streak + Achievements row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🔥</span> سلسلة الحضور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <StreakBox label="السلسلة الحالية" value={streaks.currentPresent} unit="تدريب" highlight />
              <StreakBox label="أطول سلسلة" value={streaks.longestPresent} unit="تدريب" />
              <StreakBox label="آخر 10 تدريبات" value={`${streaks.lastNAttendanceRate}%`} unit="حضور" />
            </div>
            {streaks.currentPresent >= 5 && (
              <p className="text-sm text-emerald-700 font-semibold mt-3 text-center">
                🎉 أحسنت! استمر على نفس المستوى للوصول لأطول سلسلة!
              </p>
            )}
            {streaks.currentPresent === 0 && (
              <p className="text-sm text-amber-700 font-semibold mt-3 text-center">
                💪 ابدأ سلسلتك القادمة من التدريب القادم — كل تدريب يحسبك من الصدارة.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🏆</span> الإنجازات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-black text-emerald-700 ltr-numbers">{earnedCount}</div>
              <div className="text-xs text-muted-foreground">من {achievements.length} شارة</div>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mt-3">
              {achievements.slice(0, 8).map((a: any) => (
                <div
                  key={a.id}
                  title={`${a.label}: ${a.description}`}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xl border-2 ${
                    a.earned
                      ? "bg-amber-100 border-amber-400 shadow-sm"
                      : "bg-muted/50 border-border opacity-40"
                  }`}
                >
                  {a.icon}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>📅 التدريب القادم</CardTitle></CardHeader>
          <CardContent>
            {nextTraining ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-emerald-700 text-white flex flex-col items-center justify-center font-bold shrink-0">
                    <span className="text-lg">{new Date(nextTraining.scheduled_at).getDate()}</span>
                    <span className="text-[9px] opacity-80">
                      {new Intl.DateTimeFormat("ar-EG", { month: "short" }).format(new Date(nextTraining.scheduled_at))}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">{nextTraining.categories?.name ?? "تدريب"}</div>
                    <div className="text-sm text-muted-foreground" dir="ltr">
                      {new Date(nextTraining.scheduled_at).toLocaleString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                      {nextTraining.location ? ` • ${nextTraining.location}` : ""}
                    </div>
                  </div>
                </div>
                <Countdown to={nextTraining.scheduled_at} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لا يوجد تدريب مجدول قادم.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>⚽ المباراة القادمة</CardTitle></CardHeader>
          <CardContent>
            {nextMatch ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl shrink-0">{nextMatch.match_type === "home" ? "🏠" : "✈️"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">ضد {nextMatch.opponent}</div>
                    <div className="text-sm text-muted-foreground" dir="ltr">
                      {formatDate(nextMatch.match_date, true)}
                    </div>
                    {nextMatch.venue && (
                      <div className="text-xs text-muted-foreground">📍 {nextMatch.venue}</div>
                    )}
                  </div>
                </div>
                <Countdown to={nextMatch.match_date} />
                {!player.status || player.status !== "active" ? (
                  <p className="text-xs text-red-600 font-semibold">⚠ موقوف — لن تستطيع المشاركة</p>
                ) : (
                  <p className="text-xs text-emerald-700 font-semibold">💪 جهّز نفسك جسدياً وذهنياً</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لا توجد مباراة مجدولة قادمة.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/* ============================================================================
   PERFORMANCE
   ========================================================================= */
function PerformanceSection({ attSummary, matchSummary, discipline, rank, streaks, matchParts }: any) {
  const totalMinutes = discipline?.total_minutes ?? 0;
  const matches = matchSummary?.matches_played ?? 0;
  const goalsPerMatch = matches > 0 ? (Number(matchSummary?.goals ?? 0) / matches).toFixed(2) : "0";
  const minutesPerMatch = matches > 0 ? Math.round(totalMinutes / matches) : 0;

  // Recent form (last 5 matches)
  const recent = matchParts.slice(0, 5);

  return (
    <>
      <Card>
        <CardHeader><CardTitle>📈 ملخص الأداء التراكمي</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <KpiBox label="إجمالي الدقائق" value={totalMinutes} />
            <KpiBox label="معدل دقائق/مباراة" value={minutesPerMatch} />
            <KpiBox label="معدل أهداف/مباراة" value={goalsPerMatch} />
            <KpiBox label="نسبة الحضور" value={`${attSummary?.attendance_pct ?? 0}%`} />
          </div>

          {/* Ranks */}
          <div className="space-y-3">
            <RankBar label="الترتيب في الأهداف" rank={rank.goalsRank} total={rank.total} icon="⚽" />
            <RankBar label="الترتيب في دقائق اللعب" rank={rank.minutesRank} total={rank.total} icon="⏱" />
            <RankBar label="الترتيب في الالتزام (الحضور)" rank={rank.attendanceRank} total={rank.total} icon="✅" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>🎯 الفورمة الأخيرة (آخر 5 مباريات)</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد مباريات سابقة بعد.</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {recent.map((mp: any, i: number) => {
                const result = mp.matches?.our_score == null ? null
                  : mp.matches.our_score > mp.matches.their_score ? "W"
                  : mp.matches.our_score < mp.matches.their_score ? "L" : "D";
                return (
                  <div key={i} className="rounded-lg border border-border bg-white p-2 min-w-32 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground" dir="ltr">{formatDate(mp.matches?.match_date)}</span>
                      {result && (
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white ${
                          result === "W" ? "bg-emerald-600" : result === "L" ? "bg-red-600" : "bg-gray-400"
                        }`}>
                          {result === "W" ? "ف" : result === "L" ? "خ" : "ت"}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-sm truncate mt-1">{mp.matches?.opponent}</div>
                    <div className="flex gap-2 text-[10px] mt-1.5 flex-wrap">
                      <span className="text-emerald-700">⚽ {mp.goals ?? 0}</span>
                      <span className="ltr-numbers">⏱ {mp.minutes_played ?? 0}د</span>
                      {mp.yellow_cards > 0 && <span className="text-amber-600">🟨{mp.yellow_cards}</span>}
                      {mp.red_cards > 0 && <span className="text-red-600">🟥</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>🔥 سلسلة الالتزام</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            <StreakBox label="السلسلة الحالية" value={streaks.currentPresent} unit="تدريب متتالي" highlight />
            <StreakBox label="أطول سلسلة" value={streaks.longestPresent} unit="تدريب" />
            <StreakBox label="آخر 10 تدريبات" value={`${streaks.lastNAttendanceRate}%`} unit="نسبة الحضور" />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

/* ============================================================================
   SCHEDULE
   ========================================================================= */
function ScheduleSection({ upcomingTrainings, upcomingMatches }: any) {
  return (
    <>
      <Card>
        <CardHeader><CardTitle>📅 التدريبات القادمة</CardTitle></CardHeader>
        <CardContent>
          {upcomingTrainings.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد تدريبات مجدولة في الأيام القادمة.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingTrainings.map((t: any) => (
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

      <Card>
        <CardHeader><CardTitle>⚽ المباريات القادمة</CardTitle></CardHeader>
        <CardContent>
          {upcomingMatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد مباريات قادمة.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingMatches.map((m: any) => (
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
    </>
  );
}

/* ============================================================================
   MATCHES
   ========================================================================= */
function MatchesSection({ matchParts, matchSummary }: any) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>📊 سجل المباريات والأداء</CardTitle>
          <div className="flex gap-3 text-xs">
            <span className="font-semibold">إجمالي:</span>
            <span><strong className="text-emerald-700">{matchSummary?.matches_played ?? 0}</strong> مباراة</span>
            <span><strong className="text-emerald-700">{matchSummary?.goals ?? 0}</strong> هدف</span>
            <span><strong className="text-amber-600">{matchSummary?.yellow_cards ?? 0}</strong> 🟨</span>
            <span><strong className="text-red-600">{matchSummary?.red_cards ?? 0}</strong> 🟥</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {matchParts.length === 0 ? (
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
              {matchParts.map((mp: any, i: number) => (
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
  );
}

/* ============================================================================
   ATTENDANCE
   ========================================================================= */
function AttendanceSection({ attRecords, attSummary, streaks }: any) {
  return (
    <>
      <Card>
        <CardHeader><CardTitle>🕐 ملخص الحضور</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <KpiBox label="نسبة الالتزام" value={`${attSummary?.attendance_pct ?? 0}%`} tone="success" />
            <KpiBox label="حضور" value={attSummary?.present_count ?? 0} tone="success" />
            <KpiBox label="غياب" value={attSummary?.absent_count ?? 0} tone="danger" />
            <KpiBox label="تأخير" value={attSummary?.late_count ?? 0} tone="warning" />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <StreakBox label="السلسلة الحالية" value={streaks.currentPresent} unit="تدريب" highlight />
            <StreakBox label="أطول سلسلة" value={streaks.longestPresent} unit="تدريب" />
            <StreakBox label="آخر 10 تدريبات" value={`${streaks.lastNAttendanceRate}%`} unit="نسبة" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>📋 السجل الكامل</CardTitle></CardHeader>
        <CardContent>
          {attRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا يوجد سجل حضور بعد.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {attRecords.map((r: any, i: number) => (
                <li key={i} className="flex items-center gap-2 p-2 rounded-md bg-white border border-border text-sm">
                  {r.status === "present" && <Badge variant="success">حاضر</Badge>}
                  {r.status === "absent" && <Badge variant="destructive">غائب</Badge>}
                  {r.status === "late" && <Badge variant="warning">متأخر</Badge>}
                  {r.status === "excused" && <Badge variant="muted">بعذر</Badge>}
                  <span className="text-xs flex-1 truncate" dir="ltr">
                    {formatDate(r.trainings?.scheduled_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/* ============================================================================
   DISCIPLINE
   ========================================================================= */
function DisciplineSection({ discipline, player }: any) {
  const fairPlayScore = useMemo(() => {
    const reds = discipline?.total_reds ?? 0;
    const yellows = discipline?.total_yellows ?? 0;
    const matches = discipline?.matches_called ?? 0;
    if (matches === 0) return 100;
    const penalty = (yellows * 5) + (reds * 15);
    return Math.max(0, 100 - Math.round(penalty / Math.max(1, matches)));
  }, [discipline]);

  const grade = fairPlayScore >= 90 ? "ممتاز" : fairPlayScore >= 75 ? "جيد جداً" : fairPlayScore >= 60 ? "جيد" : "يحتاج تحسين";
  const tone = fairPlayScore >= 90 ? "success" : fairPlayScore >= 60 ? "warning" : "danger";

  return (
    <>
      <Card>
        <CardHeader><CardTitle>🏅 مؤشر اللعب النظيف</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className={`text-6xl font-black ltr-numbers ${
              tone === "success" ? "text-emerald-600" : tone === "warning" ? "text-amber-600" : "text-red-600"
            }`}>
              {fairPlayScore}
            </div>
            <div className="text-sm text-muted-foreground mt-1">من 100</div>
            <Badge variant={tone === "success" ? "success" : tone === "warning" ? "warning" : "destructive"} className="mt-2">
              {grade}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center mt-4">
            <KpiBox label="إجمالي صفراء" value={discipline?.total_yellows ?? 0} tone="warning" />
            <KpiBox label="إجمالي حمراء" value={discipline?.total_reds ?? 0} tone="danger" />
            <KpiBox label="صفراء نشطة" value={`${discipline?.active_yellows ?? 0}/3`}
              tone={(discipline?.active_yellows ?? 0) >= 2 ? "warning" : "success"} />
          </div>
        </CardContent>
      </Card>

      {(discipline?.active_yellows ?? 0) === 2 && player.status === "active" && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-bold text-amber-900">تحذير: بطاقتان صفراوتان نشطتان</div>
                <div className="text-xs text-amber-800/80">البطاقة التالية ستوقفك تلقائياً عن المشاركة. العب بحذر.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

/* ============================================================================
   FINANCE
   ========================================================================= */
function FinanceSection({ subs }: any) {
  const overdue = subs.filter((s: any) => s.status !== "paid");
  const totalDue = overdue.reduce((sum: number, s: any) => sum + (Number(s.amount_due) - Number(s.amount_paid)), 0);

  return (
    <Card>
      <CardHeader><CardTitle>💳 الاشتراكات والإيصالات</CardTitle></CardHeader>
      <CardContent>
        {totalDue > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4 flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <div className="font-bold text-red-700">المتبقي عليك: {formatCurrency(totalDue)}</div>
              <div className="text-xs text-red-700/80">{overdue.length} إيصال مستحق</div>
            </div>
          </div>
        )}
        <Table>
          <THead><Tr><Th>الفترة</Th><Th>المستحق</Th><Th>المدفوع</Th><Th>المتبقي</Th><Th>الحالة</Th></Tr></THead>
          <TBody>
            {subs.map((s: any) => (
              <Tr key={s.id}>
                <Td className="text-xs">{formatDate(s.period_start)} → {formatDate(s.period_end)}</Td>
                <Td>{formatCurrency(s.amount_due)}</Td>
                <Td>{formatCurrency(s.amount_paid)}</Td>
                <Td>{formatCurrency(Number(s.amount_due) - Number(s.amount_paid))}</Td>
                <Td><Badge variant={s.status === "paid" ? "success" : s.status === "partial" ? "warning" : "destructive"}>
                  {s.status === "paid" ? "مدفوع" : s.status === "partial" ? "جزئي" : "غير مدفوع"}
                </Badge></Td>
              </Tr>
            ))}
            {subs.length === 0 && <Tr><Td colSpan={5} className="text-center py-4 text-muted-foreground">لا توجد إيصالات</Td></Tr>}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ============================================================================
   NOTIFICATIONS
   ========================================================================= */
function NotificationsSection({ notifications }: any) {
  return (
    <Card>
      <CardHeader><CardTitle>🔔 كل الإشعارات</CardTitle></CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد إشعارات.</p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((n: any) => (
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
  );
}

/* ============================================================================
   SETTINGS
   ========================================================================= */
function SettingsSection({ player }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
  );
}

/* ============================================================================
   SHARED ATOMS
   ========================================================================= */
function Stat({ label, value, icon, tone, progress, subtitle }: {
  label: string; value: string; icon?: string;
  tone?: "success" | "warning" | "danger";
  progress?: number; subtitle?: string;
}) {
  const cls = tone === "success" ? "text-emerald-700"
    : tone === "warning" ? "text-amber-600"
    : tone === "danger" ? "text-red-600"
    : "text-emerald-900";
  const barCls = tone === "success" ? "bg-emerald-500"
    : tone === "warning" ? "bg-amber-500"
    : tone === "danger" ? "bg-red-500"
    : "bg-emerald-700";

  return (
    <div className="rounded-xl bg-white border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className={`text-2xl font-black ltr-numbers ${cls}`}>{value}</div>
        {icon && <span className="text-xl opacity-50">{icon}</span>}
      </div>
      <div className="text-[11px] font-semibold text-muted-foreground mt-1">{label}</div>
      {subtitle && <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">{subtitle}</div>}
      {progress !== undefined && (
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={`h-full ${barCls} transition-all`} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      )}
    </div>
  );
}

function KpiBox({ label, value, tone }: { label: string; value: any; tone?: "success" | "warning" | "danger" }) {
  const cls = tone === "success" ? "text-emerald-700"
    : tone === "warning" ? "text-amber-600"
    : tone === "danger" ? "text-red-600"
    : "text-emerald-900";
  return (
    <div className="rounded-lg bg-emerald-50/40 border border-emerald-100 p-3 text-center">
      <div className={`text-xl font-black ltr-numbers ${cls}`}>{value}</div>
      <div className="text-[10px] font-semibold text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function StreakBox({ label, value, unit, highlight }: { label: string; value: any; unit: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "bg-gradient-to-l from-amber-100 to-amber-50 border-2 border-amber-300" : "bg-muted/30 border border-border"}`}>
      <div className={`text-3xl font-black ltr-numbers ${highlight ? "text-amber-700" : "text-emerald-900"}`}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 font-semibold">{label}</div>
      <div className="text-[9px] text-muted-foreground/60">{unit}</div>
    </div>
  );
}

function RankBar({ label, rank, total, icon }: { label: string; rank: number | null; total: number; icon: string }) {
  if (!rank || total === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        <span className="me-2">{icon}</span> {label}: لا توجد بيانات كافية
      </div>
    );
  }
  const pct = ((total - rank + 1) / total) * 100;
  const top10 = pct >= 90;
  const top25 = pct >= 75;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span><span className="me-1">{icon}</span> {label}</span>
        <span className={`font-bold ${top10 ? "text-emerald-700" : top25 ? "text-emerald-600" : ""}`}>
          المركز <span className="ltr-numbers">{rank}</span> من <span className="ltr-numbers">{total}</span>
          {top10 && " 🥇"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full transition-all ${top10 ? "bg-amber-400" : top25 ? "bg-emerald-500" : "bg-emerald-300"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Countdown({ to }: { to: string }) {
  const target = new Date(to).getTime();
  const diff = target - Date.now();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (diff < 0) return null;
  return (
    <div className="text-xs text-muted-foreground bg-emerald-100/50 rounded px-2 py-1 inline-flex items-center gap-1">
      ⏰ خلال
      {days > 0 && <span><strong className="ltr-numbers">{days}</strong> يوم</span>}
      {days === 0 && hours > 0 && <span><strong className="ltr-numbers">{hours}</strong> ساعة</span>}
      {days === 0 && hours === 0 && <span><strong>أقل من ساعة</strong></span>}
    </div>
  );
}

function posLabel(p: string | null) {
  if (!p) return "";
  return ({ GK: "حارس", DF: "دفاع", MF: "وسط", FW: "هجوم" } as any)[p] ?? p;
}

function greetingFor(name: string) {
  const h = new Date().getHours();
  const greet = h < 12 ? "صباح الخير" : h < 18 ? "مساء النور" : "أهلاً";
  const first = (name ?? "").split(" ")[0] ?? "";
  return `${greet}، ${first} 👋`;
}

function motivationalLine(att: any, match: any) {
  const pct = att?.attendance_pct ?? 0;
  const goals = match?.goals ?? 0;
  if (pct >= 95) return "التزامك مثالي — أنت قدوة لزملائك! 🏆";
  if (pct >= 85) return "أداؤك ممتاز! استمر على هذا المستوى 💪";
  if (goals >= 5) return `${goals} أهداف رصيدك — استمر في الإبداع ⚽`;
  if (pct >= 70) return "أداء جيد، يمكنك الوصول لأعلى بقليل من الالتزام 🚀";
  if (pct === 0) return "ابدأ رحلتك! كل تدريب فرصة للتقدم 🌟";
  return "كل يوم فرصة جديدة لتحسين مستواك 🎯";
}
