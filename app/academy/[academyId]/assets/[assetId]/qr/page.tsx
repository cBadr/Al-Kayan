import { createClient } from "@/lib/supabase/server";
import { requireAcademyManager } from "@/lib/auth/rbac";
import QRCode from "qrcode";
import { PrintExport } from "@/components/print-export";
import { formatDate } from "@/lib/utils";
import { headers } from "next/headers";

export default async function AssetQRPage({ params }: { params: Promise<{ academyId: string; assetId: string }> }) {
  const { academyId, assetId } = await params;
  await requireAcademyManager(academyId);
  const sb = await createClient();
  const { data: a } = await sb.from("assets").select("*").eq("id", assetId).maybeSingle();
  if (!a) return <p className="p-6">الأصل غير موجود</p>;

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}/scan/${a.qr_token}`;

  const qrSvg = await QRCode.toString(url, { type: "svg", margin: 1, width: 256 });

  return (
    <div className="bg-white">
      <div className="no-print p-4 border-b border-border flex justify-between items-center">
        <h1 className="font-bold text-lg">ملصق QR — {a.name}</h1>
        <PrintExport filename={`qr-${a.name}`} />
      </div>
      <div className="p-8 max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">{a.name}</h2>
        <div className="flex justify-center my-6" dangerouslySetInnerHTML={{ __html: qrSvg }} />
        <p className="text-sm text-muted-foreground mb-1">الكمية: {a.quantity}</p>
        <p className="text-sm text-muted-foreground mb-1">الموقع: {a.storage_location ?? "—"}</p>
        <p className="text-sm text-muted-foreground mb-1">المسؤول: {a.custodian ?? "—"}</p>
        <p className="text-xs text-muted-foreground mt-4">آخر جرد: {formatDate(a.last_inventory_at)}</p>
        <p className="text-xs ltr-numbers text-muted-foreground mt-2" dir="ltr">{url}</p>
      </div>
    </div>
  );
}
