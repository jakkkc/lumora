"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type ActionState = { ok?: boolean; message?: string; error?: string };

const STATUSES = ["new", "contacted", "confirmed", "declined", "cancelled", "completed"];

const MESSAGES: Record<string, string> = {
  new: "Reopened as new.",
  contacted: "Marked as contacted.",
  confirmed: "Confirmed. The dates are now blocked on the website.",
  declined: "Declined.",
  cancelled: "Cancelled. The dates are free again.",
  completed: "Marked as completed.",
};

const FULL: Record<string, string> = {
  stay: "Those dates overlap another confirmed booking. Check your other bookings first.",
  ride: "Every unit of this car is already booked on some of those dates.",
  tour: "This tour is already full on some of those dates.",
};

function addDay(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Empty means "not set". Returns undefined when the text is not a valid amount.
function amount(fd: FormData, key: string): number | null | undefined {
  const v = String(fd.get(key) ?? "").trim();
  if (v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100) / 100;
}

export async function updateRequest(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  const notes = String(fd.get("notes") ?? "").trim().slice(0, 4000);
  if (!STATUSES.includes(status)) return { error: "Unknown status." };

  const patch: Record<string, unknown> = { status, internal_notes: notes || null };
  for (const key of ["pickup_fee", "dropoff_fee", "final_total"]) {
    if (fd.has(key)) {
      const v = amount(fd, key);
      if (v === undefined) return { error: "Prices must be numbers of zero or more." };
      patch[key] = v;
    }
  }

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const { data: req } = await supabase
    .from("booking_requests")
    .select("id, kind, property_id, vehicle_id, tour_id, starts_on, ends_on")
    .eq("id", id)
    .maybeSingle();
  if (!req) return { error: "Request not found." };

  if (status === "confirmed") {
    const { data: existing } = await supabase
      .from("availability_blocks")
      .select("id")
      .eq("request_id", id)
      .limit(1);

    if (!existing || existing.length === 0) {
      if (!req.property_id && !req.vehicle_id && !req.tour_id) {
        return { error: "The listing for this request was removed, so its dates cannot be blocked." };
      }
      // Stays: the check-out day is free again. Cars and tours: the last day is still in use.
      const endsOn = req.kind === "stay" ? req.ends_on : addDay(req.ends_on);
      const { error } = await supabase.from("availability_blocks").insert({
        property_id: req.property_id,
        vehicle_id: req.vehicle_id,
        tour_id: req.tour_id,
        starts_on: req.starts_on,
        ends_on: endsOn,
        request_id: id,
      });
      if (error) {
        const full = error.code === "23P01" || error.message.includes("capacity_reached");
        return { error: full ? FULL[req.kind] ?? FULL.stay : "Could not block the dates. Please try again." };
      }
    }
  } else if (status !== "completed") {
    await supabase.from("availability_blocks").delete().eq("request_id", id);
  }

  const { error } = await supabase.from("booking_requests").update(patch).eq("id", id);
  if (error) return { error: "Could not save. Please try again." };

  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${id}`);
  return { ok: true, message: MESSAGES[status] };
}
