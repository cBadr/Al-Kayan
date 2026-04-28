import { PageBody, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { signedUrlMap } from "@/lib/storage";
import { deletePlayer } from "./actions";

export default async function PlayersPage({ params, searchParams }: {
  params: Promise<{ academyId: string }>;
  searchParams: Promise<{ q?: string; category?: string; status?: string; page?: string }>;
}) {
  const { academyId } = await params;
  const sp = await searchParams;
  const me = await requireAcademyAccess(academyId);
  const sb = await createClient();

  const search = (sp.q ?? "").trim();
  const category = sp.category ?? "";
  const status = sp.status ?? "";
  const page = Math.max(1, Number(sp.page ?? 1));
  const pageSize = 25;

  let q = sb.from("players").select("*, categories(name)", { count: "exact" }).eq("academy_id", academyId);
  if (search) q = q.or(`full_name.ilike.%${search}%,code.ilike.%${search}%,phone.ilike.%${search}%`);
  if (category) q = q.eq("category_id", category);
  if (status) q = q.eq("status", status);
  q = q.order("code").range((page - 1) * pageSize, page * pageSize - 1);
  const { data: players, count } = await q;

  const { data: cats } = await sb.from("categories").select("id, name").eq("academy_id", academyId);

  const isManager = me.isSuperAdmin || me.managedAcademyIds.includes(academyId);
  const photoMap = await signedUrlMap(((players ?? []) as any[]).map((p) => p.photo_url));

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  const buildHref = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    if (page > 1) params.set("page", String(page));
    Object.entries(overrides).forEach(([k, v]) => v ? params.set(k, String(v)) : params.delete(k));
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  return (
    <>
      <PageHeader
        title="اللاعبون"
        description={`${count ?? 0} لاعب مسجَّل`}
        actions={isManager ? (
          <>
            <Button asChild variant="outline"><Link href={`/academy/${academyId}/players/import`}>استيراد CSV</Link></Button>
            <Button asChild><Link href={`/academy/${academyId}/players/new`}>إضافة لاعب</Link></Button>
          </>
        ) : undefined}
      />
      <PageBody>
        <Card className="mb-4">
          <CardContent className="pt-6">
            <form className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="q" className="text-sm font-medium">بحث</label>
                <Input id="q" name="q" defaultValue={search} placeholder="اسم / كود / هاتف..." />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="category" className="text-sm font-medium">التصنيف</label>
                <select id="category" name="category" defaultValue={category} className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm">
                  <option value="">الكل</option>
                  {(cats ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="status" className="text-sm font-medium">الحالة</label>
                <div className="flex gap-2">
                  <select id="status" name="status" defaultValue={status} className="flex-1 h-10 rounded-lg border border-border bg-white px-3 text-sm">
                    <option value="">الكل</option>
                    <option value="active">نشط</option>
                    <option value="suspended">موقوف</option>
                    <option value="archived">مؤرشف</option>
                  </select>
                  <Button type="submit" size="sm">تطبيق</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Table>
          <THead>
            <Tr>
              <Th>الصورة</Th><Th>الكود</Th><Th>الاسم</Th><Th>التصنيف</Th>
              <Th>الهاتف</Th><Th>الحالة</Th><Th></Th>
            </Tr>
          </THead>
          <TBody>
            {(players ?? []).map((p: any) => {
              const photo = p.photo_url ? photoMap.get(p.photo_url) : null;
              return (
                <Tr key={p.id}>
                  <Td>
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">—</div>
                    )}
                  </Td>
                  <Td className="font-mono ltr-numbers">{p.code}</Td>
                  <Td className="font-medium">{p.full_name}</Td>
                  <Td>{p.categories?.name ?? "—"}</Td>
                  <Td dir="ltr">{p.phone ?? "—"}</Td>
                  <Td>
                    <Badge variant={p.status === "active" ? "success" : p.status === "suspended" ? "warning" : "muted"}>
                      {p.status === "active" ? "نشط" : p.status === "suspended" ? "موقوف" : "مؤرشف"}
                    </Badge>
                  </Td>
                  <Td className="text-left">
                    <div className="flex gap-3 justify-end">
                      <Link href={`/academy/${academyId}/players/${p.id}`} className="text-emerald-700 text-sm hover:underline">عرض</Link>
                      {isManager && (
                        <>
                          <Link href={`/academy/${academyId}/players/${p.id}/edit`} className="text-warning text-sm hover:underline">تعديل</Link>
                          <form action={async () => { "use server"; await deletePlayer(academyId, p.id); }}>
                            <button type="submit" className="text-destructive text-sm hover:underline">حذف</button>
                          </form>
                        </>
                      )}
                    </div>
                  </Td>
                </Tr>
              );
            })}
            {(players ?? []).length === 0 && (
              <Tr><Td colSpan={7} className="text-center text-muted-foreground py-10">لا يوجد لاعبون مطابقون</Td></Tr>
            )}
          </TBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex justify-center gap-1 mt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link key={p} href={buildHref({ page: p })}
                className={`px-3 py-1.5 rounded-md text-sm border ${p === page ? "bg-emerald-700 text-white border-emerald-700" : "border-border bg-white hover:bg-muted"}`}>{p}</Link>
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}
