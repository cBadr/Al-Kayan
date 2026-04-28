import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function ScanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data: a } = await admin.from("assets").select("*, academies(name, logo_url)").eq("qr_token", token).maybeSingle();
  if (!a) return <div className="p-8 text-center">الأصل غير موجود</div>;

  const cond = { good: ["جيد", "success"], maintenance: ["صيانة", "warning"], damaged: ["تالف", "destructive"], transferred: ["منقول", "muted"] }[a.condition as string] || ["—", "muted"];

  return (
    <div className="p-6 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <p className="text-xs text-muted-foreground">{a.academies?.name}</p>
          <CardTitle>{a.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row k="الكمية" v={a.quantity} />
          <Row k="الموقع" v={a.storage_location ?? "—"} />
          <Row k="المسؤول" v={a.custodian ?? "—"} />
          <Row k="الحالة" v={<Badge variant={cond[1] as any}>{cond[0]}</Badge>} />
          <Row k="آخر جرد" v={formatDate(a.last_inventory_at)} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
}
