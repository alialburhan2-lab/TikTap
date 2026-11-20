import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { getSettings } from "@/lib/settings";
import { logoutAction } from "@/actions/auth";
import { ADMIN_NAV } from "@/components/admin/nav";
import { Sidebar } from "@/components/admin/Sidebar";

export const metadata: Metadata = { title: { default: "لوحة الإدارة", template: "%s | لوحة الإدارة" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([requireUser(), getSettings()]);
  const items = ADMIN_NAV.filter((i) => can(user.role, i.permission));
  return (
    <div className="min-h-screen bg-paper lg:flex">
      <Sidebar items={items} siteName={settings.siteName}>
        <div className="space-y-2 px-2 text-sm">
          <Link href="/admin/profile" className="block hover:text-gold-300">
            <span className="block font-bold text-white" data-testid="current-user">{user.name}</span>
            <span className="text-xs text-gold-300">{ROLE_LABELS[user.role]}</span>
          </Link>
          <div className="flex gap-2">
            <Link href="/" target="_blank" className="flex-1 rounded border border-navy-700 px-2 py-1.5 text-center text-xs hover:border-gold-500">عرض الموقع</Link>
            <form action={logoutAction} className="flex-1">
              <button type="submit" className="w-full rounded border border-navy-700 px-2 py-1.5 text-xs hover:border-red-400 hover:text-red-300">تسجيل الخروج</button>
            </form>
          </div>
        </div>
      </Sidebar>
      <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
