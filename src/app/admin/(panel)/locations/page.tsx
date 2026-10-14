import type { Metadata } from "next";
import LocationsManager from "@/components/admin/LocationsManager";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Locations" };

export default async function LocationsPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("locations")
    .select("*, transfer_points(*)")
    .order("sort_order")
    .order("created_at");

  const locations = (data ?? []).map((l) => ({
    ...l,
    transfer_points: [...(l.transfer_points ?? [])].sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
  }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl">locations</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          The places you serve. Every stay, ride and tour belongs to one, and guests search by location first. Set
          the airport and SGR fees for each place below.
        </p>
      </div>
      <LocationsManager locations={locations} />
    </div>
  );
}
