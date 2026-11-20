"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="btn-outline px-3"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <nav id="mobile-menu" aria-label="قائمة الهاتف" className="fixed inset-x-0 top-[72px] bottom-0 z-50 overflow-y-auto bg-white">
          <ul className="divide-y divide-line">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`block px-6 py-4 text-lg font-bold ${pathname === l.href ? "text-gold-600" : "text-navy-900"}`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
