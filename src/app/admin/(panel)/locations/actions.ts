"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type FormState = { ok?: boolean; error?: string };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

function refresh() {
  revalidatePath("/admin/locations");
  revalidatePath("/", "layout");
}

// Empty means "not offered". Returns undefined when the value is not a valid fee.
function fee(v: FormDataEntryValue | null): number | null | undefined {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100) / 100;
}

async function signedIn() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user ? sb : null;
}

export async function saveLocation(_p: FormState, fd: FormData): Promise<FormState> {
  const id = String(fd.get("id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "Please enter a name." };
  const sort = Math.round(Number(String(fd.get("sort_order") ?? "0")) || 0);

  const sb = await signedIn();
  if (!sb) return { error: "Please sign in again." };

  if (id) {
    const { error } = await sb
      .from("locations")
      .update({ name, sort_order: sort, active: fd.get("active") === "on" })
      .eq("id", id);
    if (error) return { error: "Could not save. Please try again." };
  } else {
    const slug = slugify(name);
    if (!slug) return { error: "Please use letters or numbers in the name." };
    const { error } = await sb.from("locations").insert({ name, slug, sort_order: sort, active: true });
    if (error) {
      return {
        error: error.code === "23505" ? "A location with that name already exists." : "Could not save. Please try again.",
      };
    }
  }
  refresh();
  return { ok: true };
}

export async function deleteLocation(_p: FormState, fd: FormData): Promise<FormState> {
  const id = String(fd.get("id") ?? "");
  const sb = await signedIn();
  if (!sb || !id) return { error: "Please sign in again." };

  const counts = await Promise.all(
    ["properties", "vehicles", "tours"].map((t) =>
      sb.from(t).select("*", { count: "exact", head: true }).eq("location_id", id)
    )
  );
  const used = counts.reduce((n, c) => n + (c.count ?? 0), 0);
  if (used > 0) {
    return { error: `${used} listing${used === 1 ? "" : "s"} use this location. Move them to another location first.` };
  }

  const { error } = await sb.from("locations").delete().eq("id", id);
  if (error) return { error: "Could not remove it. Please try again." };
  refresh();
  return { ok: true };
}

export async function savePoint(_p: FormState, fd: FormData): Promise<FormState> {
  const id = String(fd.get("id") ?? "");
  const locationId = String(fd.get("location_id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "Please enter a name for the pickup point." };

  const kind = ["airport", "sgr", "other"].includes(String(fd.get("kind"))) ? String(fd.get("kind")) : "airport";
  const stayFee = fee(fd.get("stay_fee"));
  const rideFee = fee(fd.get("ride_fee"));
  if (stayFee === undefined || rideFee === undefined) return { error: "Fees must be numbers of zero or more." };
  const sort = Math.round(Number(String(fd.get("sort_order") ?? "0")) || 0);

  const sb = await signedIn();
  if (!sb) return { error: "Please sign in again." };

  const row = {
    name,
    kind,
    stay_fee: stayFee,
    ride_fee: rideFee,
    sort_order: sort,
    active: fd.get("active") === "on",
  };

  if (id) {
    const { error } = await sb.from("transfer_points").update(row).eq("id", id);
    if (error) return { error: "Could not save. Please try again." };
  } else {
    const { error } = await sb.from("transfer_points").insert({ ...row, location_id: locationId, active: true });
    if (error) return { error: "Could not save. Please try again." };
  }
  refresh();
  return { ok: true };
}

export async function deletePoint(_p: FormState, fd: FormData): Promise<FormState> {
  const id = String(fd.get("id") ?? "");
  const sb = await signedIn();
  if (!sb || !id) return { error: "Please sign in again." };
  const { error } = await sb.from("transfer_points").delete().eq("id", id);
  if (error) return { error: "Could not remove it. Please try again." };
  refresh();
  return { ok: true };
}
