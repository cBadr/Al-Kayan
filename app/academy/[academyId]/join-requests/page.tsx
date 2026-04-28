import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import { formatDate } from "@/lib/utils";
import { signedUrlMap } from "@/lib/storage";
import { approveRequest, rejectRequest } from "./actions";

export default async function JoinRequestsPage({ params, searchParams }: {
  params: Promise<{ academyId: string }>;
  searchParams: Promise<{ tab?: "pending" | "archive" }>;
}) {
  const { academyId } = await params;
  const sp = await searchParams;
  const tab = sp.tab ?? "pending";
  await requireAcademyManager(academyId);
  const sb = await createClient();

  const { count: pendingCount } = await sb
    .from("join_requests")
    .select("id", { count: "exact", head: true })
    .eq("academy_id", academyId)
    .eq("status", "pending");

  const q = sb.from("join_requests")
    .select("*, categories:desired_category_id(name)")
    .eq("academy_id", academyId)
    .order("created_at", { ascending: false });
  if (tab === "pending") q.eq("status", "pending");
  else q.in("status", ["approved", "rejected"]);
  const { data: requests } = await q;

  const { data: cats } = await sb.from("categories").select("id, name").eq("academy_id", academyId).eq("active", true);

  const photoMap = await signedUrlMap([
    ...((requests ?? []) as any[]).map((r) => r.photo_url),
    ...((requests ?? []) as any[]).map((r) => r.id_doc_url),
  ]);

  return (
    <>
      <PageHeader
        title="طلبات الانضمام"
        description="مراجعة طلبات اللاعبين الجدد"
      />
      <PageBody>
        <div className="flex gap-2 mb-6 items-center">
          <Link
            href={`/academy/${academyId}/join-requests?tab=pending`}
            className={`px-4 py-2 rounded-md text-sm border flex items-center gap-2 ${tab === "pending" ? "bg-primary text-white border-primary" : "border-border"}`}
          >
            الطلبات الجديدة
            {(pendingCount ?? 0) > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-warning text-white text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </Link>
          <Link
            href={`/academy/${academyId}/join-requests?tab=archive`}
            className={`px-4 py-2 rounded-md text-sm border ${tab === "archive" ? "bg-primary text-white border-primary" : "border-border"}`}
          >
            الأرشيف
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(requests ?? []).map((r: any) => {
            const photo = r.photo_url ? photoMap.get(r.photo_url) : null;
            const idDoc = r.id_doc_url ? photoMap.get(r.id_doc_url) : null;
            return (
              <Card key={r.id} className={r.status === "rejected" ? "opacity-70" : ""}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className="w-24 h-24 rounded-lg object-cover flex-shrink-0 border border-border" />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center text-muted-foreground text-xs">لا صورة</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-lg">{r.full_name}</h3>
                        <Badge variant={r.status === "pending" ? "warning" : r.status === "approved" ? "success" : "destructive"}>
                          {r.status === "pending" ? "قيد المراجعة" : r.status === "approved" ? "مقبول" : "مرفوض"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        تاريخ التقديم: {formatDate(r.created_at, true)}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-sm mt-3">
                        <Field label="الميلاد" value={formatDate(r.birth_date)} />
                        <Field label="الهاتف" value={r.phone} dir="ltr" />
                        <Field label="ولي الأمر" value={r.guardian_name} />
                        <Field label="هاتف الولي" value={r.guardian_phone} dir="ltr" />
                        <Field label="التصنيف المرغوب" value={r.categories?.name} />
                        <Field label="الرقم القومي" value={r.national_id} dir="ltr" />
                      </div>
                      {idDoc && (
                        <div className="mt-3 flex gap-3">
                          <a href={idDoc} target="_blank" rel="noopener" className="text-primary text-sm hover:underline">
                            📄 عرض شهادة الميلاد
                          </a>
                          <a href={idDoc} download className="text-primary text-sm hover:underline">
                            ⬇️ تحميل
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {r.status === "pending" && (
                    <div className="flex gap-2 items-center pt-4 mt-4 border-t border-border">
                      <form action={async (fd) => { "use server"; await approveRequest(academyId, r.id, fd); }} className="flex gap-2 items-center flex-1">
                        <select name="category_id" required defaultValue={r.desired_category_id ?? ""}
                                className="h-9 rounded-md border border-border bg-card px-2 text-sm flex-1">
                          <option value="">— اختر التصنيف —</option>
                          {(cats ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <Button size="sm" type="submit">قبول</Button>
                      </form>
                      <form action={async () => { "use server"; await rejectRequest(academyId, r.id); }}>
                        <Button size="sm" variant="destructive" type="submit">رفض</Button>
                      </form>
                    </div>
                  )}

                  {r.status === "rejected" && r.rejection_reason && (
                    <div className="mt-3 pt-3 border-t border-border text-xs text-destructive">
                      سبب الرفض: {r.rejection_reason}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {(requests ?? []).length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-8">
              {tab === "pending" ? "لا توجد طلبات جديدة" : "لا توجد طلبات في الأرشيف"}
            </p>
          )}
        </div>
      </PageBody>
    </>
  );
}

function Field({ label, value, dir }: { label: string; value: string | null | undefined; dir?: string }) {
  if (!value) return null;
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <span dir={dir} className="font-medium">{value}</span>
    </div>
  );
}
