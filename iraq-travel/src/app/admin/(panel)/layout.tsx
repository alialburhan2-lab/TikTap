import Link from "next/link";
import { Logo } from "@/components/logo";
import { requireStaff } from "@/lib/auth";
import { canManage } from "@/lib/permissions";
import { ENTITIES, ENTITY_ORDER } from "@/lib/admin/entities";
import { logoutAction } from "../actions";
import { repo } from "@/lib/store";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const kind = repo().kind;
  const groups = new Map<string, { href: string; label: string }[]>();
  for (const name of ENTITY_ORDER) {
    const cfg = ENTITIES[name]!;
    if (!canManage(user.role, name)) continue;
    groups.set(cfg.group, [...(groups.get(cfg.group) ?? []), { href: `/admin/content/${name}`, label: cfg.label }]);
  }
  const isSuper = user.role === "super_admin";
  const trust = [
    ...(canManage(user.role, "scamReports") ? [{ href: "/admin/reports", label: "Complaints & reports" }] : []),
    ...(canManage(user.role, "verificationDocuments") ? [{ href: "/admin/verification", label: "Provider verification" }] : []),
  ];
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col bg-river-950 text-sand-200 md:flex">
        <div className="p-5"><Link href="/admin"><Logo light tagline="Admin" /></Link></div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6 text-sm" aria-label="Admin">
          <div><Link href="/admin" className="block rounded-lg px-3 py-2 hover:bg-white/10">Dashboard & analytics</Link></div>
          {[...groups.entries()].map(([g, links]) => (
            <div key={g}>
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gold-300">{g}</p>
              {links.map((l) => <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-1.5 hover:bg-white/10">{l.label}</Link>)}
            </div>
          ))}
          {trust.length > 0 && (
            <div>
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gold-300">Traveler protection</p>
              {trust.map((l) => <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-1.5 hover:bg-white/10">{l.label}</Link>)}
            </div>
          )}
          <div>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gold-300">System</p>
            <Link href="/admin/languages" className="block rounded-lg px-3 py-1.5 hover:bg-white/10">Languages</Link>
            {isSuper && <Link href="/admin/users" className="block rounded-lg px-3 py-1.5 hover:bg-white/10">Users & roles</Link>}
            {isSuper && <Link href="/admin/logs" className="block rounded-lg px-3 py-1.5 hover:bg-white/10">Audit log</Link>}
            <Link href="/en" className="block rounded-lg px-3 py-1.5 hover:bg-white/10">View public site ↗</Link>
          </div>
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-river-900/10 bg-white px-6 py-3">
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="font-semibold text-river-900 md:hidden">Admin</Link>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${kind === "supabase" ? "bg-emerald-100 text-emerald-800" : "bg-fuchsia-100 text-fuchsia-800"}`}>{kind === "supabase" ? "Supabase" : "DEMO local store"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-charcoal-600">{user.displayName} · <span className="font-mono text-xs">{user.role}</span></span>
            <form action={logoutAction}><button className="btn-outline px-3 py-1.5 text-xs">Sign out</button></form>
          </div>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-river-900/10 bg-white px-4 py-2 text-xs md:hidden" aria-label="Admin mobile">
          {[...groups.values()].flat().concat(trust).map((l) => <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-full bg-sand-100 px-3 py-1">{l.label}</Link>)}
        </nav>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
