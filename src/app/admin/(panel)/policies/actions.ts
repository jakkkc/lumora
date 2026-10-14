"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type FormState = { ok?: boolean; error?: string };

function refresh() {
  revalidatePath("/admin/policies");
  revalidatePath("/", "layout");
}

async function signedIn() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user ? sb : null;
}

export async function savePolicy(_p: FormState, fd: FormData): Promise<FormState> {
  const id = String(fd.get("id") ?? "");
  const service = String(fd.get("service") ?? "");
  const title = String(fd.get("title") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  const sort = Math.round(Number(String(fd.get("sort_order") ?? "0")) || 0);

  if (!["stay", "ride", "tour"].includes(service)) return { error: "Unknown service." };
  if (!title) return { error: "Please enter a title." };
  if (title.length > 120) return { error: "The title is too long. Keep it under 120 characters." };
  if (!body) return { error: "Please enter the policy text." };
  if (body.length > 6000) return { error: "The text is too long. Keep it under 6000 characters." };

  const sb = await signedIn();
  if (!sb) return { error: "Please sign in again." };

  const row = {
    title,
    body,
    sort_order: sort,
    published: fd.get("published") === "on",
    only_for_similar: service === "ride" && fd.get("only_for_similar") === "on",
  };

  if (id) {
    const { error } = await sb.from("policies").update(row).eq("id", id);
    if (error) return { error: "Could not save. Please try again." };
  } else {
    const { error } = await sb.from("policies").insert({ ...row, service });
    if (error) return { error: "Could not save. Please try again." };
  }
  refresh();
  return { ok: true };
}

export async function deletePolicy(_p: FormState, fd: FormData): Promise<FormState> {
  const id = String(fd.get("id") ?? "");
  const sb = await signedIn();
  if (!sb || !id) return { error: "Please sign in again." };
  const { error } = await sb.from("policies").delete().eq("id", id);
  if (error) return { error: "Could not remove it. Please try again." };
  refresh();
  return { ok: true };
}
