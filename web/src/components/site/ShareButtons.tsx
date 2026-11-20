"use client";

import { useState } from "react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const tt = encodeURIComponent(title);
  const links = [
    { label: "X", href: `https://twitter.com/intent/tweet?url=${u}&text=${tt}` },
    { label: "فيسبوك", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: "واتساب", href: `https://wa.me/?text=${tt}%20${u}` },
    { label: "تيليغرام", href: `https://t.me/share/url?url=${u}&text=${tt}` },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-bold text-navy-900">شارك المقال:</span>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="btn-outline px-3 py-1.5 text-xs">
          {l.label}
        </a>
      ))}
      <button
        type="button"
        className="btn-outline px-3 py-1.5 text-xs"
        onClick={async () => {
          try {
            if (navigator.share) await navigator.share({ title, url });
            else {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          } catch {
            /* أُلغيت المشاركة */
          }
        }}
      >
        {copied ? "تم النسخ" : "نسخ الرابط"}
      </button>
    </div>
  );
}
