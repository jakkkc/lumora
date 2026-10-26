"use server";

import { revalidatePath } from "next/cache";
import { pushConfigured, sendPush } from "@/lib/push";
import { supabaseServer } from "@/lib/supabase/server";

export type PushState = { ok?: boolean; error?: string; message?: string };

async function signedIn() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user ? sb : null;
}

const b64url = /^[A-Za-z0-9_-]+$/;

export async function saveSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  label: string;
}): Promise<PushState> {
  const { endpoint, p256dh, auth } = input;
  if (!/^https:\/\/[^\s]{10,1000}$/.test(endpoint)) return { error: "That device address is not valid." };
  if (!b64url.test(p256dh) || p256dh.length < 40 || p256dh.length > 200) return { error: "That device key is not valid." };
  if (!b64url.test(auth) || auth.length < 10 || auth.length > 100) return { error: "That device key is not valid." };

  const sb = await signedIn();
  if (!sb) return { error: "Please sign in again." };

  const { error } = await sb
    .from("push_subscriptions")
    .upsert({ endpoint, p256dh, auth, label: input.label.slice(0, 60) || null }, { onConflict: "endpoint" });
  if (error) return { error: "Could not save this device. Please try again." };

  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function removeSubscription(endpoint: string): Promise<PushState> {
  const sb = await signedIn();
  if (!sb) return { error: "Please sign in again." };
  const { error } = await sb.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) return { error: "Could not remove it. Please try again." };
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function sendTest(): Promise<PushState> {
  if (!pushConfigured()) {
    return { error: "The server does not have its notification keys yet. Add the three keys, then try again." };
  }
  const sb = await signedIn();
  if (!sb) return { error: "Please sign in again." };

  const { data } = await sb.from("push_subscriptions").select("endpoint, p256dh, auth");
  const subs = (data ?? []) as { endpoint: string; p256dh: string; auth: string }[];
  if (subs.length === 0) return { error: "No phone is signed up yet. Turn notifications on first." };

  const r = await sendPush(subs, {
    title: "Lumora test",
    body: "Notifications are working on this phone.",
    url: "/admin/notifications",
    tag: "lumora-test",
  });

  if (r.gone.length > 0) await sb.from("push_subscriptions").delete().in("endpoint", r.gone);
  revalidatePath("/admin/notifications");

  if (r.sent === 0) {
    return {
      error: r.gone.length > 0
        ? "That phone is no longer reachable and was removed. Turn notifications on again."
        : "The notification could not be delivered. Please try again.",
    };
  }
  return { ok: true, message: `Sent to ${r.sent} ${r.sent === 1 ? "phone" : "phones"}. It should arrive in a few seconds.` };
}
