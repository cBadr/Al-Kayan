"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full bg-transparent border-white/20 text-white/90 hover:bg-white/10 hover:text-white hover:border-gold-400/40"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      تسجيل الخروج
    </Button>
  );
}
