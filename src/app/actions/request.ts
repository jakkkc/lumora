"use server";

import { supabasePublic } from "@/lib/supabase/public";

export type RequestState = { ok: boolean; reference?: string; error?: string };

const ERRORS: Record<string, string> = {
  invalid_dates: "Please check your dates. The start date cannot be in the past, and a stay needs at least one night.",
  invalid_guests: "Please choose how many guests are travelling.",
  too_many_guests: "That is more guests than this stay sleeps.",
  dates_unavailable: "Those dates are not available. Please choose different dates.",
  invalid_name: "Please enter your full name.",
  invalid_email: "Please enter a valid email address.",
  invalid_phone: "Please enter a valid phone number.",
  too_long: "Your message is too long. Please shorten it.",
  too_many_requests: "You have sent several requests already. Please wait a little, or message us on WhatsApp.",
  listing_not_found: "This listing is no longer available.",
  min_nights: "This stay needs a longer minimum number of nights.",
};

const FALLBACK = "Something went wrong. Please try again, or message us on WhatsApp.";

export async function submitRequest(_prev: RequestState, fd: FormData): Promise<RequestState> {
  const get = (k: string) => String(fd.get(k) ?? "").trim();
  const kind = get("kind");
  const listingId = get("listing_id");
  const start = get("starts_on");
  const end = get("ends_on");

  const db = supabasePublic();

  if (kind === "stay" && start && end) {
    const { data } = await db.from("properties").select("min_nights").eq("id", listingId).maybeSingle();
    const nights = Math.round((Date.parse(end) - Date.parse(start)) / 86400000);
    if (data && nights < data.min_nights) return { ok: false, error: ERRORS.min_nights };
  }

  const { data, error } = await db.rpc("submit_booking_request", {
    p_kind: kind,
    p_listing_id: listingId,
    p_starts_on: start || null,
    p_ends_on: end || null,
    p_guests: Number(get("guests")) || 0,
    p_pickup: get("pickup"),
    p_with_driver: get("with_driver") === "1",
    p_full_name: get("full_name"),
    p_email: get("email"),
    p_phone: get("phone"),
    p_message: get("message"),
    p_website: get("website"),
  });

  if (error) {
    const key = Object.keys(ERRORS).find((k) => error.message.includes(k));
    return { ok: false, error: key ? ERRORS[key] : FALLBACK };
  }
  return { ok: true, reference: String(data) };
}
