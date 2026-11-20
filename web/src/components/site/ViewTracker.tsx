"use client";

import { useEffect } from "react";

/** يسجّل زيارة الصفحة مرة واحدة (بدون ملفات تعريف ارتباط) */
export function ViewTracker({ articleId }: { articleId?: string }) {
  useEffect(() => {
    const body = JSON.stringify({ path: window.location.pathname, articleId, referrer: document.referrer || undefined });
    fetch("/api/views", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => undefined);
  }, [articleId]);
  return null;
}
