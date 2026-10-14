"use client";

import { useEffect } from "react";

// Registers the service worker on the live site. While developing, it removes any
// old worker and its saved copies, so you always see your latest code.
export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((list) => list.forEach((r) => r.unregister()));
      if ("caches" in window) {
        caches.keys().then((keys) => keys.filter((k) => k.startsWith("lumora-")).forEach((k) => caches.delete(k)));
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}
