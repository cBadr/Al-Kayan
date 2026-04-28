import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "@/components/logo";
import { getAppSettings } from "@/lib/app-settings";

export const dynamic = "force-dynamic";
import Link from "next/link";

export default async function JoinIndex() {
  const sb = await createClient();
  const [{ data: academies }, s] = await Promise.all([
    sb.from("academies").select("id, slug, name, logo_url, address").order("name"),
    getAppSettings(),
  ]);

  return (
    <div className="flex-1 bg-mesh-emerald min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-10 animate-fade-up">
          <div className="mx-auto mb-4 w-fit"><BrandLogo className="w-16 h-16" rounded="rounded-2xl" /></div>
          <h1 className="text-4xl font-black text-gradient-gold">انضم إلى {s.app_name}</h1>
          <p className="text-white/75 mt-3 text-lg">اختر الأكاديمية التي تود الانضمام إليها</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger">
          {(academies ?? []).map((a: any) => (
            <Link key={a.id} href={`/join/${a.slug}`} className="group">
              <Card className="hover:border-gold-400/50 transition-all">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-gold-400 flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-105 transition-transform">
                    {a.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.logo_url} alt="" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <span>{a.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-emerald-950 group-hover:text-emerald-700 transition-colors">{a.name}</div>
                    {a.address && <div className="text-xs text-muted-foreground mt-0.5 truncate">{a.address}</div>}
                  </div>
                  <span className="text-emerald-700 group-hover:translate-x-[-4px] transition-transform">←</span>
                </CardContent>
              </Card>
            </Link>
          ))}
          {(academies ?? []).length === 0 && (
            <p className="text-white/70 col-span-full text-center py-10">لا توجد أكاديميات متاحة حالياً.</p>
          )}
        </div>
      </div>
    </div>
  );
}
