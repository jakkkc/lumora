"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type SaveState = { error?: string; saved?: boolean };
type Kind = "stay" | "ride" | "tour";

const TABLE: Record<Kind, string> = { stay: "properties", ride: "vehicles", tour: "tours" };
const COL: Record<Kind, string> = { stay: "property_id", ride: "vehicle_id", tour: "tour_id" };
const SEGMENT: Record<Kind, string> = { stay: "stays", ride: "rides", tour: "tours" };

const toKind = (v: FormDataEntryValue | null): Kind => (v === "ride" || v === "tour" ? v : "stay");

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

// Empty means "not set". Returns undefined when the text is not a number.
function optNum(fd: FormData, key: string): number | null | undefined {
  const v = String(fd.get(key) ?? "").trim();
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function refreshPublic() {
  revalidatePath("/", "layout");
}

export async function saveListing(_prev: SaveState, fd: FormData): Promise<SaveState> {
  const kind = toKind(fd.get("kind"));
  const id = String(fd.get("id") ?? "");
  const g = (k: string) => String(fd.get(k) ?? "").trim();

  const title = g("title");
  if (!title) return { error: "Please enter a name." };
  const slug = slugify(g("slug") || title);
  if (!slug) return { error: "Please enter a web address using letters or numbers." };

  const locationId = g("location_id");
  if (!locationId) return { error: "Please choose a location. Add one on the Locations page if the list is empty." };

  const status = ["draft", "published", "archived"].includes(g("status")) ? g("status") : "draft";
  const sort = Math.round(num(fd, "sort_order", 0));
  if (Number.isNaN(sort)) return { error: "The display order must be a number." };

  const common = {
    title,
    slug,
    tagline: g("tagline") || null,
    description: g("description") || null,
    status,
    featured: fd.get("featured") === "on",
    sort_order: sort,
    currency: (g("currency") || "KES").toUpperCase().slice(0, 3),
    location_id: locationId,
  };

  let row: Record<string, unknown>;

  if (kind === "stay") {
    const bedrooms = num(fd, "bedrooms", 1);
    const bathrooms = num(fd, "bathrooms", 1);
    const guests = num(fd, "max_guests", 2);
    const price = num(fd, "price_per_night", NaN);
    const minNights = num(fd, "min_nights", 1);
    if ([bedrooms, bathrooms, guests, price, minNights].some(Number.isNaN))
      return { error: "Please check the numbers. The price per night is required." };
    if (bedrooms < 0 || bathrooms < 0 || guests < 1 || price < 0 || minNights < 1)
      return { error: "One of the numbers is out of range." };
    row = {
      ...common,
      area: g("area") || null,
      bedrooms: Math.round(bedrooms),
      bathrooms,
      max_guests: Math.round(guests),
      price_per_night: price,
      min_nights: Math.round(minNights),
      check_in_time: g("check_in_time") || "14:00",
      check_out_time: g("check_out_time") || "10:00",
      amenities: lines(String(fd.get("amenities") ?? "")),
      house_rules: g("house_rules") || null,
      transfers_enabled: fd.get("transfers_enabled") === "on",
    };
  } else if (kind === "ride") {
    const seats = num(fd, "seats", 4);
    const units = num(fd, "units", 1);
    const minDays = num(fd, "min_days", 1);
    const deposit = num(fd, "deposit", 0);
    const self = optNum(fd, "price_per_day");
    const chauf = optNum(fd, "chauffeur_price_per_day");
    const yearRaw = g("year");
    const year = yearRaw === "" ? null : Number(yearRaw);
    if (
      [seats, units, minDays, deposit].some(Number.isNaN) ||
      self === undefined ||
      chauf === undefined ||
      (year !== null && !Number.isFinite(year))
    )
      return { error: "Please check the numbers." };
    if (self === null && chauf === null)
      return { error: "Enter a self-drive price, a chauffeured price, or both." };
    if (
      seats < 1 ||
      units < 1 ||
      minDays < 1 ||
      deposit < 0 ||
      (self !== null && self < 0) ||
      (chauf !== null && chauf < 0) ||
      (year !== null && (year < 1990 || year > 2100))
    )
      return { error: "One of the numbers is out of range." };

    const both = self !== null && chauf !== null;
    row = {
      ...common,
      make: g("make") || null,
      model: g("model") || null,
      year,
      category: g("category") || null,
      seats: Math.round(seats),
      transmission: g("transmission") === "manual" ? "manual" : "automatic",
      fuel: g("fuel") || null,
      price_per_day: self,
      chauffeur_price_per_day: chauf,
      // kept so the current public pages keep working until they are rebuilt
      driver_option: both ? "both" : chauf !== null ? "with_driver" : "self_drive",
      driver_fee_per_day: both ? Math.max((chauf as number) - (self as number), 0) : 0,
      deposit,
      features: lines(String(fd.get("features") ?? "")),
      units: Math.round(units),
      or_similar: fd.get("or_similar") === "on",
      min_days: Math.round(minDays),
      delivery_enabled: fd.get("delivery_enabled") === "on",
    };
  } else {
    const tourType = g("tour_type") === "guide" ? "guide" : "fixed";
    const price = num(fd, "price", NaN);
    const minPeople = num(fd, "min_people", 1);
    const maxGroup = num(fd, "max_group", 10);
    const perDay = num(fd, "capacity_per_day", 1);
    if ([price, minPeople, maxGroup, perDay].some(Number.isNaN))
      return { error: "Please check the numbers. The price is required." };
    if (price < 0 || minPeople < 1 || maxGroup < 1 || perDay < 1)
      return { error: "One of the numbers is out of range." };
    if (maxGroup < minPeople) return { error: "The largest group cannot be smaller than the smallest group." };
    const basisRaw = g("price_basis");
    const basis = tourType === "guide" ? "per_day" : basisRaw === "per_group" ? "per_group" : "per_person";
    row = {
      ...common,
      tour_type: tourType,
      price,
      price_basis: basis,
      duration_text: g("duration_text") || null,
      meeting_point: g("meeting_point") || null,
      min_people: Math.round(minPeople),
      max_group: Math.round(maxGroup),
      capacity_per_day: Math.round(perDay),
      languages: lines(String(fd.get("languages") ?? "")),
      includes: lines(String(fd.get("includes") ?? "")),
      excludes: lines(String(fd.get("excludes") ?? "")),
    };
  }

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  let newId = id;
  if (id) {
    const { error } = await supabase.from(TABLE[kind]).update(row).eq("id", id);
    if (error) return { error: saveError(error.code) };
  } else {
    const { data, error } = await supabase.from(TABLE[kind]).insert(row).select("id").single();
    if (error || !data) return { error: saveError(error?.code) };
    newId = data.id;
  }

  revalidatePath("/", "layout");
  if (!id) redirect(`/admin/${SEGMENT[kind]}/${newId}?created=1`);
  return { saved: true };
}

function saveError(code?: string) {
  if (code === "23505") return "That web address is already used by another listing. Please change it.";
  if (code === "23514") return "One of the values is out of range. Please check the form.";
  return "Could not save. Please try again.";
}

export async function deleteListing(fd: FormData) {
  const kind = toKind(fd.get("kind"));
  const id = String(fd.get("id") ?? "");
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !id) redirect("/admin/login");

  const { data: imgs } = await supabase.from("listing_images").select("path").eq(COL[kind], id);
  const paths = (imgs ?? []).map((i) => i.path as string);
  if (paths.length) await supabase.storage.from("listing-images").remove(paths);

  await supabase.from(TABLE[kind]).delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect(`/admin/${SEGMENT[kind]}`);
}
