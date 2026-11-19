"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function MobileNav({ items, label }: { items: { href: string; label: string }[]; label: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-river-900 ring-1 ring-river-900/15 hover:bg-sand-100"
      >
        <span className="sr-only">{label}</span>
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          {open ? <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
        </svg>
      </button>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-river-900/10 bg-sand-50 shadow-xl">
          <nav aria-label={label} className="container-x grid gap-1 py-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((i) => (
              <Link key={i.href} href={i.href} className={`rounded-xl px-4 py-3 font-medium hover:bg-white ${pathname === i.href ? "bg-white text-gold-700" : "text-river-900"}`}>
                {i.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
