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
