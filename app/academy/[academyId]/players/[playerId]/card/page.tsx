import { createClient } from "@/lib/supabase/server";
import { requireAcademyAccess } from "@/lib/auth/rbac";
import { signedUrl } from "@/lib/storage";
import { LogoMark } from "@/components/logo";
import { PrintExport } from "@/components/print-export";
import { formatDate } from "@/lib/utils";
import QRCode from "qrcode";
import { headers } from "next/headers";

export default async function PlayerCardPage({ params }: { params: Promise<{ academyId: string; playerId: string }> }) {
  const { academyId, playerId } = await params;
  await requireAcademyAccess(academyId);
  const sb = await createClient();
  const { data: p } = await sb
    .from("players")
    .select("*, categories(name), academies(name, logo_url, address)")
    .eq("id", playerId)
    .maybeSingle();
  if (!p) return <p className="p-6">اللاعب غير موجود</p>;
  const photo = await signedUrl(p.photo_url);

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const profileUrl = `${proto}://${host}/academy/${academyId}/players/${playerId}`;
  const qrSvg = await QRCode.toString(profileUrl, { type: "svg", margin: 0, width: 90 });

  return (
    <div className="bg-pitch min-h-screen">
      <div className="no-print p-4 border-b border-border bg-white flex justify-between items-center">
        <h1 className="font-bold text-lg">بطاقة عضوية اللاعب</h1>
        <PrintExport filename={`card-${p.code}-${p.full_name}`} />
      </div>

      <div className="p-8 flex justify-center">
        <div className="w-[640px] h-[400px] rounded-2xl overflow-hidden shadow-2xl bg-mesh-emerald text-white relative">
          {/* gold corner ribbon */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-gold-400 to-gold-600 opacity-95" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
          <div className="absolute top-3 left-3 text-obsidian-900 font-black text-xs">PLAYER · لاعب</div>

          {/* pitch decoration */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 640 400">
            <circle cx="320" cy="200" r="80" stroke="white" strokeWidth="2" fill="none" />
            <line x1="320" y1="0" x2="320" y2="400" stroke="white" strokeWidth="2" />
          </svg>

          <div className="relative z-10 p-7 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <LogoMark className="w-12 h-12" />
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-gold-400 font-bold">{p.academies?.name}</div>
                  <div className="text-[9px] text-white/55 mt-0.5">{p.academies?.address ?? ""}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-gold-400 font-bold">رقم اللاعب</div>
                <div className="text-3xl font-black ltr-numbers font-mono mt-1">{p.code}</div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="avatar-ring">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-emerald-900 flex items-center justify-center">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl text-gold-400 font-black">{p.full_name?.charAt(0)}</span>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-gold-400 font-bold">الاسم</div>
                <div className="text-2xl font-black truncate">{p.full_name}</div>
                <div className="text-sm text-white/70 mt-3">{p.categories?.name ?? "—"}</div>
                <div className="text-xs text-white/55 mt-1">
                  انضم في {formatDate(p.joined_at)}
                </div>
              </div>
              <div className="bg-white p-2 rounded" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </div>

            <div className="text-[9px] text-white/45 text-center pt-2 border-t border-white/10">
              صالحة فقط لحاملها · أي استخدام غير مصرح يبطل البطاقة
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
