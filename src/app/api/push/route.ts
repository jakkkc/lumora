import { NextResponse } from "next/server";
import { sendPush, type StoredSub } from "@/lib/push";

export const dynamic = "force-dynamic";

// Only real phone push services are allowed as destinations.
const PUSH_HOSTS = ["googleapis.com", "push.services.mozilla.com", "push.apple.com", "notify.windows.com"];

function allowed(endpoint: string) {
  try {
    const u = new URL(endpoint);
    if (u.protocol !== "https:") return false;
    return PUSH_HOSTS.some((d) => u.hostname === d || u.hostname.endsWith("." + d));
  } catch {
    return false;
  }
}

// Compares two strings without giving away, through timing, how much of a guess was right.
function same(a: string, b: string) {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  const secret = (process.env.NOTIFY_SECRET ?? "").trim();
  const given = req.headers.get("x-notify-secret") ?? "";
  if (secret.length < 20 || !same(given, secret)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const title = text(input.title, 80);
  const body = text(input.body, 240);
  if (!title) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const url = text(input.url, 200);
  const tag = text(input.tag, 60);
  const count = Number(input.count);

  const subs: StoredSub[] = [];
  if (Array.isArray(input.subscriptions)) {
    for (const s of input.subscriptions.slice(0, 20)) {
      const e = (s ?? {}) as Record<string, unknown>;
      const endpoint = text(e.endpoint, 1000);
      const p256dh = text(e.p256dh, 200);
      const auth = text(e.auth, 100);
      if (allowed(endpoint) && p256dh && auth) subs.push({ endpoint, p256dh, auth });
    }
  }

  const result = await sendPush(subs, {
    title,
    body,
    url: url.startsWith("/admin") ? url : "/admin/requests",
    tag: tag || undefined,
    count: Number.isInteger(count) && count >= 0 && count < 10000 ? count : undefined,
  });

  return NextResponse.json({ sent: result.sent, failed: result.failed, gone: result.gone });
}
