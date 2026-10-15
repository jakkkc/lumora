import { supabasePublic } from "./supabase/public";
import type { Property, Vehicle } from "./types";

const IMAGES = "listing_images(path, alt, sort_order, is_cover)";

export async function getStays(): Promise<Property[]> {
  const { data, error } = await supabasePublic()
    .from("properties")
    .select(`*, ${IMAGES}`)
    .eq("status", "published")
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (error) console.error("getStays:", error.message);
  return (data ?? []) as Property[];
}

export async function getStay(slug: string): Promise<Property | null> {
  const { data, error } = await supabasePublic()
    .from("properties")
    .select(`*, ${IMAGES}`)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) console.error("getStay:", error.message);
  return (data as Property | null) ?? null;
}

export async function getRides(): Promise<Vehicle[]> {
  const { data, error } = await supabasePublic()
    .from("vehicles")
    .select(`*, ${IMAGES}`)
    .eq("status", "published")
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (error) console.error("getRides:", error.message);
  return (data ?? []) as Vehicle[];
}

export async function getRide(slug: string): Promise<Vehicle | null> {
  const { data, error } = await supabasePublic()
    .from("vehicles")
    .select(`*, ${IMAGES}`)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) console.error("getRide:", error.message);
  return (data as Vehicle | null) ?? null;
}

export type Block = { starts_on: string; ends_on: string };

// Dates already taken (end date is the day it is free again).
export async function getBlocks(kind: "stay" | "ride", id: string): Promise<Block[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabasePublic()
    .from("availability_blocks")
    .select("starts_on, ends_on")
    .eq(kind === "stay" ? "property_id" : "vehicle_id", id)
    .gte("ends_on", today)
    .order("starts_on");
  if (error) console.error("getBlocks:", error.message);
  return (data ?? []) as Block[];
}

export type PublicLocation = { id: string; slug: string; name: string };

export async function getLocations(): Promise<PublicLocation[]> {
  const { data, error } = await supabasePublic()
    .from("locations")
    .select("id, slug, name")
    .eq("active", true)
    .order("sort_order")
    .order("name");
  if (error) console.error("getLocations:", error.message);
  return (data ?? []) as PublicLocation[];
}

import { addDays as addIsoDay } from "./dates";

export type StayDetail = Property & {
  location_id: string | null;
  transfers_enabled: boolean;
  location: { name: string; slug: string } | null;
};

export async function getStayDetail(slug: string): Promise<StayDetail | null> {
  const { data, error } = await supabasePublic()
    .from("properties")
    .select(`*, location:locations(name, slug), ${IMAGES}`)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) console.error("getStayDetail:", error.message);
  return (data as StayDetail | null) ?? null;
}

export type TransferPointPublic = {
  id: string;
  name: string;
  kind: "airport" | "sgr" | "other";
  stay_fee: number | null;
  ride_fee: number | null;
};

export async function getTransferPoints(locationId: string | null): Promise<TransferPointPublic[]> {
  if (!locationId) return [];
  const { data, error } = await supabasePublic()
    .from("transfer_points")
    .select("id, name, kind, stay_fee, ride_fee")
    .eq("location_id", locationId)
    .eq("active", true)
    .order("sort_order");
  if (error) console.error("getTransferPoints:", error.message);
  return (data ?? []).map((p) => ({
    ...p,
    stay_fee: p.stay_fee === null ? null : Number(p.stay_fee),
    ride_fee: p.ride_fee === null ? null : Number(p.ride_fee),
  })) as TransferPointPublic[];
}

export type PolicyPublic = { id: string; title: string; body: string; only_for_similar: boolean };

export async function getPolicies(service: "stay" | "ride" | "tour"): Promise<PolicyPublic[]> {
  const { data, error } = await supabasePublic()
    .from("policies")
    .select("id, title, body, only_for_similar")
    .eq("service", service)
    .eq("published", true)
    .order("sort_order")
    .order("created_at");
  if (error) console.error("getPolicies:", error.message);
  return (data ?? []) as PolicyPublic[];
}

/** Days when every unit is taken. Stays have one unit; cars and tours use their own capacity. */
export async function getFullDays(kind: "stay" | "ride" | "tour", id: string, cap: number): Promise<string[]> {
  const col = kind === "stay" ? "property_id" : kind === "ride" ? "vehicle_id" : "tour_id";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
  const { data, error } = await supabasePublic()
    .from("availability_blocks")
    .select("starts_on, ends_on")
    .eq(col, id)
    .gte("ends_on", today);
  if (error) console.error("getFullDays:", error.message);

  const counts = new Map<string, number>();
  for (const b of data ?? []) {
    let d: string = b.starts_on < today ? today : b.starts_on;
    let guard = 0;
    while (d < b.ends_on && guard++ < 800) {
      counts.set(d, (counts.get(d) ?? 0) + 1);
      d = addIsoDay(d, 1);
    }
  }
  return [...counts]
    .filter(([, n]) => n >= Math.max(cap, 1))
    .map(([d]) => d)
    .sort();
}
