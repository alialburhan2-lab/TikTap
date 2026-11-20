import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-guard";
import { getSettings } from "@/lib/settings";
import { LogoMark } from "@/components/site/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "تسجيل الدخول", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  if (await getCurrentUser()) redirect("/admin");
  const [{ callbackUrl }, settings] = await Promise.all([searchParams, getSettings()]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <LogoMark className="h-16 w-16" />
          <h1 className="text-2xl font-extrabold text-navy-900">{settings.siteName}</h1>
          <p className="text-sm text-muted">لوحة الإدارة — تسجيل الدخول</p>
        </div>
        <LoginForm callbackUrl={typeof callbackUrl === "string" ? callbackUrl : "/admin"} />
      </div>
    </div>
  );
}
