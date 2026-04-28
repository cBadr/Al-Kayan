import { LoginForm } from "./login-form";
import Link from "next/link";
import { Suspense } from "react";
import { BrandLogo } from "@/components/logo";
import { getAppSettings } from "@/lib/app-settings";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const s = await getAppSettings();
  return (
    <div className="flex flex-1 relative overflow-hidden bg-mesh-emerald">
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gold-400/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-emerald-500/15 blur-3xl" />

      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-scale-in">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-fit"><BrandLogo className="w-16 h-16 drop-shadow-lg" rounded="rounded-2xl" /></div>
            <h1 className="text-3xl font-black text-gradient-gold">{s.app_name}</h1>
            {s.tagline && <p className="text-white/70 mt-2 text-sm">{s.tagline}</p>}
          </div>

          <div className="glass rounded-2xl p-7 shadow-2xl">
            <h2 className="text-xl font-bold text-emerald-950 mb-5">أهلاً بعودتك ⚽</h2>
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>

          <p className="text-center text-sm text-white/70 mt-6">
            ليس لديك حساب؟{" "}
            <Link href="/join" className="text-gold-400 font-semibold hover:underline">
              تقدم بطلب انضمام
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
