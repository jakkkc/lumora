"use server";

import { supabasePublic } from "@/lib/supabase/public";

export type BookingState = { ok: boolean; reference?: string; error?: string };

const ERRORS: Record<string, string> = {
  invalid_dates: "Please check your dates. The start cannot be in the past, and the end cannot be before the start.",
  invalid_guests: "Please choose how many people are travelling.",
  too_many_guests: "That is more people than this listing allows.",
  group_size: "The group size is outside what this tour allows.",
  dates_unavailable: "Those dates are not available. Please choose different dates.",
  min_stay: "This stay needs a longer minimum number of nights.",
  min_days: "This car needs a longer minimum number of days.",
  invalid_name: "Please enter your full name.",
  invalid_email: "Please enter a valid email address.",
  invalid_phone: "Please enter a valid phone number.",
  too_long: "Something you typed is too long. Please shorten it.",
  too_many_requests: "You have sent several requests already. Please wait a little, or message us on WhatsApp.",
  listing_not_found: "This listing is no longer available.",
  invalid_drive: "Please choose self-drive or chauffeured.",
  drive_unavailable: "That drive option is not offered for this car.",
  invalid_transfer: "Please check your pickup or drop off details.",
  transfer_unavailable: "That pickup or drop off is not offered here.",
  policies_not_accepted: "Please accept the policies and terms to continue.",
  invalid_input: "Please check the form and try again.",
  invalid_kind: "Something went wrong. Please try again.",
};

const FALLBACK = "Something went wrong. Please try again, or message us on WhatsApp.";

export async function submitBooking(_prev: BookingState, fd: FormData): Promise<BookingState> {
  const get = (k: string) => String(fd.get(k) ?? "").trim();

  const payload = {
    kind: get("kind"),
    listing_id: get("listing_id"),
    starts_on: get("starts_on"),
    ends_on: get("ends_on"),
    guests: get("guests"),
    drive_type: get("drive_type"),
    pickup_mode: get("pickup_mode"),
    pickup_point_id: get("pickup_point_id"),
    pickup_address: get("pickup_address"),
    pickup_lat: get("pickup_lat"),
    pickup_lng: get("pickup_lng"),
    pickup_time: get("pickup_time"),
    pickup_flight: get("pickup_flight"),
    dropoff_mode: get("dropoff_mode"),
    dropoff_point_id: get("dropoff_point_id"),
    dropoff_address: get("dropoff_address"),
    dropoff_lat: get("dropoff_lat"),
    dropoff_lng: get("dropoff_lng"),
    dropoff_time: get("dropoff_time"),
    dropoff_flight: get("dropoff_flight"),
    full_name: get("full_name"),
    email: get("email"),
    phone: get("phone"),
    message: get("message"),
    accepted: fd.get("accepted") === "on" ? "true" : "",
    website: get("website"),
  };

  const { data, error } = await supabasePublic().rpc("submit_booking", { p: payload });

  if (error) {
    const key = Object.keys(ERRORS).find((k) => error.message.includes(k));
    if (!key) console.error("submit_booking:", error.message);
    return { ok: false, error: key ? ERRORS[key] : FALLBACK };
  }
  return { ok: true, reference: String(data) };
}
