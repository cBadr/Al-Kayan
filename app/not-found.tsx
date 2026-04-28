import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center bg-mesh-emerald p-6">
      <div className="text-center space-y-5 animate-scale-in">
        <h1 className="text-7xl font-black text-gradient-gold">404</h1>
        <p className="text-white/80 text-lg">الصفحة المطلوبة غير موجودة</p>
        <Button asChild variant="gold" size="lg"><Link href="/">العودة للرئيسية</Link></Button>
      </div>
    </div>
  );
}
