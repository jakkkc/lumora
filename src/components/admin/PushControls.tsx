"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { removeSubscription, saveSubscription, sendTest } from "@/app/admin/(panel)/notifications/actions";

type Device = { endpoint: string; label: string | null; added: string };
type Support = "checking" | "ready" | "unsupported" | "ios-install" | "no-worker";

function keyToBytes(base64url: string) {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function deviceLabel() {
  const ua = navigator.userAgent;
  const os = /android/i.test(ua) ? "Android" : /iphone|ipad|ipod/i.test(ua) ? "iPhone" : /windows/i.test(ua) ? "Windows" : /mac/i.test(ua) ? "Mac" : "Device";
  const app = /edg/i.test(ua) ? "Edge" : /firefox/i.test(ua) ? "Firefox" : /chrome|crios/i.test(ua) ? "Chrome" : /safari/i.test(ua) ? "Safari" : "Browser";
  return `${os}, ${app}`;
}

const primary =
  "bg-accent px-6 py-3 text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50";
const quiet =
  "border border-line px-6 py-3 text-sm tracking-widest text-muted transition-colors hover:border-accent hover:text-fg disabled:opacity-50";

export default function PushControls({
  publicKey,
  serverReady,
  devices,
}: {
  publicKey: string | null;
  serverReady: boolean;
  devices: Device[];
}) {
  const [support, setSupport] = useState<Support>("checking");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [here, setHere] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      const capable = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!capable) {
        if (alive) setSupport(ios && !standalone ? "ios-install" : "unsupported");
        return;
      }
      if (alive) setPermission(Notification.permission);
      const reg = await navigator.serviceWorker.getRegistration();
      if (!alive) return;
      if (!reg) {
        setSupport("no-worker");
        return;
      }
      const sub = await reg.pushManager.getSubscription();
      if (!alive) return;
      setHere(sub?.endpoint ?? null);
      setSupport("ready");
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function turnOn() {
    if (!publicKey) return;
    setBusy(true);
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setMsg({
          text: "Notifications are blocked. Allow them for Lumora in your phone or browser settings, then try again.",
          bad: true,
        });
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const old = await reg.pushManager.getSubscription();
      if (old) {
        await removeSubscription(old.endpoint);
        await old.unsubscribe();
      }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) });
      const j = sub.toJSON();
      const r = await saveSubscription({
        endpoint: sub.endpoint,
        p256dh: j.keys?.p256dh ?? "",
        auth: j.keys?.auth ?? "",
        label: deviceLabel(),
      });
      if (r.error) {
        setMsg({ text: r.error, bad: true });
        return;
      }
      setHere(sub.endpoint);
      setMsg({ text: "Notifications are on for this phone. Send a test to check." });
    } catch {
      setMsg({ text: "Could not turn on notifications. Please try again.", bad: true });
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removeSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setHere(null);
      setMsg({ text: "Notifications are off for this phone." });
    } catch {
      setMsg({ text: "Could not turn them off. Please try again.", bad: true });
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMsg(null);
    const r = await sendTest();
    setMsg(r.error ? { text: r.error, bad: true } : { text: r.message ?? "Sent." });
    setBusy(false);
  }

  async function removeDevice(endpoint: string) {
    setBusy(true);
    await removeSubscription(endpoint);
    setBusy(false);
  }

  const on = here !== null && permission === "granted";

  return (
    <div className="space-y-8">
      {(!serverReady || !publicKey) && (
        <p className="border border-line p-4 text-sm">
          The notification keys are not on the server yet. Add the three keys to Cloudflare, redeploy, then come back.
        </p>
      )}

      {support === "checking" && <p className="text-sm text-muted">Checking this phone...</p>}

      {support === "ios-install" && (
        <p className="border border-line p-4 text-sm">
          On an iPhone, notifications only work after the Lumora Admin app is on your Home Screen. Open this page in
          Safari, tap Share, choose Add to Home Screen, then open the app from your Home Screen and come back here.
        </p>
      )}

      {support === "unsupported" && (
        <p className="border border-line p-4 text-sm">
          This browser cannot receive notifications. Use Chrome on Android, or Safari on an iPhone with the app added
          to the Home Screen.
        </p>
      )}

      {support === "no-worker" && (
        <p className="border border-line p-4 text-sm">
          The app&apos;s background helper is not running yet. Reload this page once. Notifications only work on the
          live website, not on the test version on your computer.
        </p>
      )}

      {support === "ready" && (
        <div className="space-y-5">
          <p className="flex items-center gap-3 text-sm">
            <Icon name="bell" size={20} />
            This phone:{" "}
            <span className="tracking-wide">
              {permission === "denied" ? "blocked" : on ? "notifications on" : "notifications off"}
            </span>
          </p>
          <div className="flex flex-wrap gap-3">
            {on ? (
              <>
                <button type="button" onClick={test} disabled={busy} className={primary}>
                  Send a test notification
                </button>
                <button type="button" onClick={turnOff} disabled={busy} className={quiet}>
                  Turn off on this phone
                </button>
              </>
            ) : (
              <button type="button" onClick={turnOn} disabled={busy || !publicKey} className={primary}>
                Turn on notifications
              </button>
            )}
          </div>
        </div>
      )}

      {msg && (
        <p
          role={msg.bad ? "alert" : "status"}
          className={`text-sm ${msg.bad ? "underline decoration-accent underline-offset-4" : "text-muted"}`}
        >
          {msg.text}
        </p>
      )}

      {devices.length > 0 && (
        <section aria-labelledby="devices">
          <h2 id="devices" className="mb-3 text-xl">phones that get alerts</h2>
          <ul className="divide-y divide-line border-y border-line">
            {devices.map((d) => (
              <li key={d.endpoint} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate">
                    {d.label ?? "Phone"}
                    {d.endpoint === here ? " (this phone)" : ""}
                  </p>
                  <p className="text-xs text-muted">Added {d.added}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeDevice(d.endpoint)}
                  disabled={busy}
                  aria-label="Remove this phone"
                  className="grid h-9 w-9 shrink-0 place-items-center border border-line text-muted transition-colors hover:border-accent hover:text-fg disabled:opacity-50"
                >
                  <Icon name="trash" size={15} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
