"use client";

import { useEffect } from "react";

/** Registers the offline service worker (used by the Emergency Center "save for offline" feature). */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);
  return null;
}
