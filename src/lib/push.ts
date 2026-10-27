import { buildPushPayload } from "@block65/webcrypto-web-push";

export type StoredSub = { endpoint: string; p256dh: string; auth: string };
export type PushNote = { title: string; body: string; url?: string; tag?: string; count?: number };
export type SendResult = { sent: number; failed: number; gone: string[]; reasons: string[] };

// Keys sometimes pick up spaces, line breaks or quote marks when they are copied. Remove them.
const clean = (v?: string) => (v ?? "").replace(/\s+/g, "").replace(/^["']+|["']+$/g, "");

export const vapidPublicKey = () => clean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) || null;

function keys() {
  const publicKey = clean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  const privateKey = clean(process.env.VAPID_PRIVATE_KEY);
  const subject = (process.env.VAPID_SUBJECT ?? "").trim().replace(/^["']+|["']+$/g, "");
  if (!publicKey || !privateKey || !subject) return null;
  return { publicKey, privateKey, subject };
}

export const pushConfigured = () => keys() !== null;

/** Sends one notification to every saved phone. A phone that has gone is listed in `gone`. */
export async function sendPush(subs: StoredSub[], note: PushNote): Promise<SendResult> {
  const vapid = keys();
  const result: SendResult = { sent: 0, failed: 0, gone: [], reasons: [] };
  if (!vapid || subs.length === 0) return result;
  const data = JSON.stringify(note);

  await Promise.all(
    subs.map(async (s) => {
      try {
        const sub = {
          endpoint: s.endpoint,
          expirationTime: null,
          keys: { p256dh: s.p256dh, auth: s.auth },
        };
        const req = await buildPushPayload({ data, options: { ttl: 6 * 3600, urgency: "high" } }, sub, vapid);
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 8000);
        const res = await fetch(s.endpoint, {
          method: req.method,
          headers: req.headers,
          body: req.body as BodyInit,
          signal: ctl.signal,
        }).finally(() => clearTimeout(timer));
        if (res.ok) result.sent += 1;
        else if (res.status === 404 || res.status === 410) result.gone.push(s.endpoint);
        else {
          result.failed += 1;
          result.reasons.push(`the push service answered ${res.status}`);
        }
      } catch (e) {
        result.failed += 1;
        result.reasons.push(e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 120) : "unknown error");
      }
    })
  );
  return result;
}
