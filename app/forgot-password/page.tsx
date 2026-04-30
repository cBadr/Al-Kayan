import { Suspense } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/logo";
import { ForgotPasswordForm } from "./forgot-form";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-1 relative overflow-hidden bg-mesh-emerald">
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gold-400/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-emerald-500/15 blur-3xl" />

      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-scale-in">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-fit"><BrandLogo className="w-16 h-16 drop-shadow-lg" rounded="rounded-2xl" /></div>
            <h1 className="text-3xl font-black text-gradient-gold">استعادة كلمة المرور</h1>
            <p className="text-white/70 mt-2 text-sm">سنرسل لك رابطاً لإعادة تعيين كلمة المرور</p>
          </div>

          <div className="glass rounded-2xl p-7 shadow-2xl">
            <Suspense fallback={null}>
              <ForgotPasswordForm />
            </Suspense>
          </div>

          <p className="text-center text-sm text-white/70 mt-6">
            <Link href="/login" className="text-gold-400 font-semibold hover:underline">
              العودة لتسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
