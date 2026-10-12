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

function addDay(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function updateRequest(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  const notes = String(fd.get("notes") ?? "").trim().slice(0, 4000);
  if (!STATUSES.includes(status)) return { error: "Unknown status." };

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const { data: req } = await supabase
    .from("booking_requests")
    .select("id, kind, property_id, vehicle_id, starts_on, ends_on")
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
      // Stays: the check-out day is free again. Rides: the return day is still in use.
      const endsOn = req.kind === "ride" ? addDay(req.ends_on) : req.ends_on;
      const { error } = await supabase.from("availability_blocks").insert({
        property_id: req.property_id,
        vehicle_id: req.vehicle_id,
        starts_on: req.starts_on,
        ends_on: endsOn,
        request_id: id,
      });
      if (error) {
        return {
          error:
            error.code === "23P01"
              ? "Those dates overlap another confirmed booking. Check your other bookings first."
              : "Could not block the dates. Please try again.",
        };
      }
    }
  } else if (status !== "completed") {
    await supabase.from("availability_blocks").delete().eq("request_id", id);
  }

  const { error } = await supabase
    .from("booking_requests")
    .update({ status, internal_notes: notes || null })
    .eq("id", id);
  if (error) return { error: "Could not save. Please try again." };

  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${id}`);
  return { ok: true, message: MESSAGES[status] };
}
