"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type PayState = { ok?: boolean; error?: string };

const METHODS = ["mpesa", "cash", "bank", "card", "other"];

async function signedIn() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user ? sb : null;
}

function refresh(requestId: string) {
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/accounts");
}

export async function addPayment(_p: PayState, fd: FormData): Promise<PayState> {
  const requestId = String(fd.get("request_id") ?? "");
  const kind = fd.get("kind") === "refund" ? "refund" : "payment";
  const amount = Number(String(fd.get("amount") ?? "").replace(/,/g, "").trim());
  const method = String(fd.get("method") ?? "");
  const reference = String(fd.get("reference") ?? "").trim().slice(0, 80);
  const paidOn = String(fd.get("paid_on") ?? "");
  const note = String(fd.get("note") ?? "").trim().slice(0, 300);

  if (!Number.isFinite(amount) || amount <= 0) return { error: "Please enter an amount greater than zero." };
  if (amount > 100000000) return { error: "That amount looks too large. Please check it." };
  if (!METHODS.includes(method)) return { error: "Please choose how it was paid." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidOn) || Number.isNaN(Date.parse(paidOn))) {
    return { error: "Please choose the date." };
  }

  const sb = await signedIn();
  if (!sb || !requestId) return { error: "Please sign in again." };

  const { error } = await sb.from("payments").insert({
    request_id: requestId,
    kind,
    amount: Math.round(amount * 100) / 100,
    method,
    reference: reference || null,
    paid_on: paidOn,
    note: note || null,
  });
  if (error) return { error: "Could not save. Please try again." };

  refresh(requestId);
  return { ok: true };
}

export async function deletePayment(_p: PayState, fd: FormData): Promise<PayState> {
  const id = String(fd.get("id") ?? "");
  const requestId = String(fd.get("request_id") ?? "");
  const sb = await signedIn();
  if (!sb || !id) return { error: "Please sign in again." };

  const { error } = await sb.from("payments").delete().eq("id", id);
  if (error) return { error: "Could not remove it. Please try again." };

  refresh(requestId);
  return { ok: true };
}
