import { PageBody, PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import Link from "next/link";
import { addAsset, deleteAsset } from "./actions";
import { ConditionSelect } from "./condition-select";

export default async function AssetsPage({ params }: { params: Promise<{ academyId: string }> }) {
  const { academyId } = await params;
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const { data: assets } = await sb.from("assets").select("*").eq("academy_id", academyId).order("name");

  return (
    <>
      <PageHeader title="الأصول الثابتة" description="كرات، شباك، أقماع تدريب..." />
      <PageBody>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form action={async (fd) => { "use server"; await addAsset(academyId, fd); }}
                  className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div className="space-y-1.5"><Label htmlFor="name">اسم الأصل</Label><Input id="name" name="name" required /></div>
              <div className="space-y-1.5"><Label htmlFor="quantity">الكمية</Label><Input id="quantity" name="quantity" type="number" defaultValue="1" /></div>
              <div className="space-y-1.5"><Label htmlFor="storage_location">الموقع</Label><Input id="storage_location" name="storage_location" /></div>
              <div className="space-y-1.5"><Label htmlFor="custodian">المسؤول</Label><Input id="custodian" name="custodian" /></div>
              <div className="space-y-1.5"><Label htmlFor="image">صورة</Label><Input id="image" name="image" type="file" accept="image/*" /></div>
              <Button type="submit">إضافة</Button>
            </form>
          </CardContent>
        </Card>

        <Table>
          <THead><Tr><Th>الصورة</Th><Th>الاسم</Th><Th>الكمية</Th><Th>الموقع</Th><Th>المسؤول</Th><Th>الحالة</Th><Th>QR</Th><Th></Th></Tr></THead>
          <TBody>
            {(assets ?? []).map((a: any) => (
              <Tr key={a.id}>
                <Td>
                  {a.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.image_url} alt="" className="w-12 h-12 rounded-md object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">⚽</div>
                  )}
                </Td>
                <Td className="font-medium">{a.name}</Td>
                <Td>{a.quantity}</Td>
                <Td>{a.storage_location ?? "—"}</Td>
                <Td>{a.custodian ?? "—"}</Td>
                <Td>
                  <ConditionSelect academyId={academyId} assetId={a.id} defaultValue={a.condition} />
                </Td>
                <Td><Link href={`/academy/${academyId}/assets/${a.id}/qr`} className="text-emerald-700 text-sm hover:underline">QR</Link></Td>
                <Td>
                  <form action={async () => { "use server"; await deleteAsset(academyId, a.id); }}>
                    <button className="text-destructive text-sm hover:underline" type="submit">حذف</button>
                  </form>
                </Td>
              </Tr>
            ))}
            {(assets ?? []).length === 0 && <Tr><Td colSpan={8} className="text-center text-muted-foreground py-8">لا توجد أصول</Td></Tr>}
          </TBody>
        </Table>
      </PageBody>
    </>
  );
}
