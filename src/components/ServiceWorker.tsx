"use client";

import { useEffect } from "react";

// Registers the service worker on the live site. Skipped while developing,
// so old copies never confuse you.
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}
