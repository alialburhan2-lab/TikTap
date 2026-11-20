"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { NavItem } from "./nav";

export function Sidebar({ items, siteName, children }: { items: NavItem[]; siteName: string; children?: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || (pathname.startsWith(href + "/") && href !== "/admin/articles") || (href === "/admin/articles" && pathname.startsWith("/admin/articles") && pathname !== "/admin/articles/new"));

  return (
    <>
      <div className="flex h-14 items-center justify-between bg-navy-900 px-4 text-white lg:hidden">
        <span className="font-display font-extrabold">{siteName} — الإدارة</span>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="القائمة" className="rounded p-2 hover:bg-white/10">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </div>
      <aside className={`${open ? "block" : "hidden"} w-full shrink-0 bg-navy-900 text-navy-100 lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:overflow-y-auto`}>
        <div className="hidden border-b border-navy-800 p-5 lg:block">
          <Link href="/admin" className="font-display text-lg font-extrabold text-white">{siteName}</Link>
          <p className="text-xs text-gold-300">لوحة الإدارة</p>
        </div>
        <nav aria-label="قائمة الإدارة" className="p-3">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active(item.href) ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold transition ${active(item.href) ? "bg-gold-500 text-navy-900" : "hover:bg-navy-800"}`}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-navy-800 p-3">{children}</div>
      </aside>
    </>
  );
}
