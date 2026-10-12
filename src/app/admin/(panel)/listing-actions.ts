"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type SaveState = { error?: string; saved?: boolean };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const lines = (s: string) =>
  s
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 60);

function num(fd: FormData, key: string, fallback = 0) {
  const v = String(fd.get(key) ?? "").trim();
  if (v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export async function refreshPublic() {
  revalidatePath("/", "layout");
}

export async function saveListing(_prev: SaveState, fd: FormData): Promise<SaveState> {
  const kind = String(fd.get("kind")) === "ride" ? "ride" : "stay";
  const id = String(fd.get("id") ?? "");
  const g = (k: string) => String(fd.get(k) ?? "").trim();

  const title = g("title");
  if (!title) return { error: "Please enter a name." };
  const slug = slugify(g("slug") || title);
  if (!slug) return { error: "Please enter a web address using letters or numbers." };

  const status = ["draft", "published", "archived"].includes(g("status")) ? g("status") : "draft";
  const common = {
    title,
    slug,
    tagline: g("tagline") || null,
    description: g("description") || null,
    status,
    featured: fd.get("featured") === "on",
    sort_order: Math.round(num(fd, "sort_order", 0)),
    currency: (g("currency") || "KES").toUpperCase().slice(0, 3),
  };
  if (Number.isNaN(common.sort_order)) return { error: "The display order must be a number." };

  let table: "properties" | "vehicles";
  let row: Record<string, unknown>;

  if (kind === "stay") {
    table = "properties";
    const bedrooms = num(fd, "bedrooms", 1);
    const bathrooms = num(fd, "bathrooms", 1);
    const guests = num(fd, "max_guests", 2);
    const price = num(fd, "price_per_night", NaN);
    const cleaning = num(fd, "cleaning_fee", 0);
    const minNights = num(fd, "min_nights", 1);
    if ([bedrooms, bathrooms, guests, price, cleaning, minNights].some(Number.isNaN))
      return { error: "Please check the numbers. The price per night is required." };
    if (bedrooms < 0 || bathrooms < 0 || guests < 1 || price < 0 || cleaning < 0 || minNights < 1)
      return { error: "One of the numbers is out of range." };
    row = {
      ...common,
      area: g("area") || null,
      bedrooms: Math.round(bedrooms),
      bathrooms,
      max_guests: Math.round(guests),
      price_per_night: price,
      cleaning_fee: cleaning,
      min_nights: Math.round(minNights),
      check_in_time: g("check_in_time") || "14:00",
      check_out_time: g("check_out_time") || "10:00",
      amenities: lines(String(fd.get("amenities") ?? "")),
      house_rules: g("house_rules") || null,
    };
  } else {
    table = "vehicles";
    const seats = num(fd, "seats", 4);
    const price = num(fd, "price_per_day", NaN);
    const driverFee = num(fd, "driver_fee_per_day", 0);
    const deposit = num(fd, "deposit", 0);
    const yearRaw = g("year");
    const year = yearRaw === "" ? null : Number(yearRaw);
    if ([seats, price, driverFee, deposit].some(Number.isNaN) || (year !== null && !Number.isFinite(year)))
      return { error: "Please check the numbers. The price per day is required." };
    if (seats < 1 || price < 0 || driverFee < 0 || deposit < 0 || (year !== null && (year < 1990 || year > 2100)))
      return { error: "One of the numbers is out of range." };
    const transmission = g("transmission") === "manual" ? "manual" : "automatic";
    const driverOption = ["self_drive", "with_driver", "both"].includes(g("driver_option"))
      ? g("driver_option")
      : "both";
    row = {
      ...common,
      make: g("make") || null,
      model: g("model") || null,
      year,
      category: g("category") || null,
      seats: Math.round(seats),
      transmission,
      fuel: g("fuel") || null,
      price_per_day: price,
      driver_option: driverOption,
      driver_fee_per_day: driverFee,
      deposit,
      features: lines(String(fd.get("features") ?? "")),
    };
  }

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  let newId = id;
  if (id) {
    const { error } = await supabase.from(table).update(row).eq("id", id);
    if (error) return { error: saveError(error.code) };
  } else {
    const { data, error } = await supabase.from(table).insert(row).select("id").single();
    if (error || !data) return { error: saveError(error?.code) };
    newId = data.id;
  }

  revalidatePath("/", "layout");
  if (!id) redirect(`/admin/${kind === "stay" ? "stays" : "rides"}/${newId}?created=1`);
  return { saved: true };
}

function saveError(code?: string) {
  if (code === "23505") return "That web address is already used by another listing. Please change it.";
  if (code === "23514") return "One of the values is out of range. Please check the form.";
  return "Could not save. Please try again.";
}

export async function deleteListing(fd: FormData) {
  const kind = String(fd.get("kind")) === "ride" ? "ride" : "stay";
  const id = String(fd.get("id") ?? "");
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !id) redirect("/admin/login");

  const table = kind === "stay" ? "properties" : "vehicles";
  const col = kind === "stay" ? "property_id" : "vehicle_id";

  const { data: imgs } = await supabase.from("listing_images").select("path").eq(col, id);
  const paths = (imgs ?? []).map((i) => i.path as string);
  if (paths.length) await supabase.storage.from("listing-images").remove(paths);

  await supabase.from(table).delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect(kind === "stay" ? "/admin/stays" : "/admin/rides");
}
