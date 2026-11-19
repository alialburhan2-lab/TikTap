import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/admin/login-form";
import { getCurrentUser } from "@/lib/auth";
import { demoAuthEnabled, supabaseConfigured } from "@/lib/env";
import { isStaff } from "@/lib/permissions";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user && isStaff(user.role)) redirect("/admin");
  const demo = demoAuthEnabled() && !supabaseConfigured();
  return (
    <main className="flex min-h-screen items-center justify-center bg-river-950 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo light tagline="Staff dashboard" /></div>
        <div className="card p-8">
          <h1 className="font-display text-2xl font-bold text-river-900">Staff login</h1>
          <p className="mt-1 text-sm text-charcoal-600">{supabaseConfigured() ? "Sign in with your Supabase account." : demo ? "Demo authentication is active (local development only)." : "No authentication backend is configured."}</p>
          <LoginForm />
          {demo && (
            <div className="mt-6 rounded-xl bg-fuchsia-50 p-4 text-xs text-fuchsia-900 ring-1 ring-fuchsia-500/30">
              <p className="font-bold">DEMO accounts</p>
              <p className="mt-1">admin@ / editor@ / prices@ / safety@ / verify@<span className="font-mono">iraqtravel.demo</span></p>
              <p className="mt-1">Password: the value of <span className="font-mono">DEMO_ADMIN_PASSWORD</span>, or the development default documented in README.md.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
