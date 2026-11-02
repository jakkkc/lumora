"use server";

import { revalidatePath } from "next/cache";
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

