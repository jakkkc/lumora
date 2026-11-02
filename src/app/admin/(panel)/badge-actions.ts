"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function newRequestCount(): Promise<number> {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return 0;
  const { count } = await sb
    .from("booking_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");
  return count ?? 0;
}
