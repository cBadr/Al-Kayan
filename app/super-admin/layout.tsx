import { requireSuperAdmin } from "@/lib/auth/rbac";
import { AppShell } from "@/components/app-shell";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSuperAdmin();
  return (
    <AppShell
      title="مدير عام للنظام"
      user={{ fullName: user.fullName, email: user.email, roleLabel: "Super Admin" }}
      nav={[
        { href: "/super-admin", label: "اللوحة الرئيسية" },
        { href: "/super-admin/academies", label: "الأكاديميات" },
        { href: "/super-admin/users", label: "المستخدمون" },
        { href: "/super-admin/reports", label: "التقارير الموحدة" },
        { href: "/super-admin/settings", label: "إعدادات النظام" },
      ]}
    >
      {children}
    </AppShell>
  );
}
