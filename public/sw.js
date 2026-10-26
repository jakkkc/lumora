/* Lumora service worker: offline pages, faster repeat visits and phone notifications.
   Never stores the admin area or anything private. */
const VERSION = "lumora-v2";
const PAGES = `${VERSION}-pages`;
const STATIC = `${VERSION}-static`;
const IMAGES = `${VERSION}-images`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGES).then((cache) => cache.add("/offline")).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) await cache.delete(keys[0]);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Never take over localhost, so development always shows fresh code.
  if (self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Private or dynamic areas: always go straight to the network, never store.
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api")) return;

  // Pages: network first, then the last copy, then the offline page.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match("/offline")))
    );
    return;
  }

  // Scripts, styles, fonts and app icons: they never change at the same address.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pwa-icon/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // Photos: show the saved copy instantly, refresh it in the background.
  if (url.pathname.startsWith("/_next/image")) {
    event.respondWith(
      caches.open(IMAGES).then(async (cache) => {
        const hit = await cache.match(req);
        const fresh = fetch(req)
          .then((res) => {
            if (res.ok) {
              cache.put(req, res.clone());
              trim(IMAGES, 80);
            }
            return res;
          })
          .catch(() => hit);
        return hit || fresh;
      })
    );
  }
});

// A notification arrives from the server.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Lumora", body: event.data ? event.data.text() : "" };
  }

  const options = {
    body: data.body || "",
    icon: "/pwa-icon/admin-192",
    badge: "/pwa-icon/admin-192",
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    data: { url: data.url || "/admin/requests" },
  };

  const jobs = [self.registration.showNotification(data.title || "Lumora", options)];
  if (typeof data.count === "number" && self.navigator && self.navigator.setAppBadge) {
    jobs.push(self.navigator.setAppBadge(data.count).catch(() => {}));
  }
  event.waitUntil(Promise.all(jobs));
});

// Tapping a notification opens the right page in the admin app.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/admin/requests";

  event.waitUntil(
    (async () => {
      const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of list) {
        if (c.url.includes("/admin") && "focus" in c) {
          await c.focus();
          if ("navigate" in c) await c.navigate(target);
          return;
        }
      }
      await self.clients.openWindow(target);
    })()
  );
});
