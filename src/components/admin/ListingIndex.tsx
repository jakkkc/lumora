import Link from "next/link";
import { money } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";

type Row = {
  id: string;
  title: string;
  status: string;
  featured: boolean;
  currency: string;
  area?: string | null;
  category?: string | null;
  price_per_night?: number;
  price_per_day?: number;
  listing_images: { count: number }[];
};

const badge: Record<string, string> = {
  published: "bg-accent text-on-accent",
  draft: "border border-accent text-fg",
  archived: "border border-line text-muted",
};

export default async function ListingIndex({ kind }: { kind: "stay" | "ride" }) {
  const supabase = await supabaseServer();
  const isStay = kind === "stay";
  const { data } = await supabase
    .from(isStay ? "properties" : "vehicles")
    .select(
      `id, title, status, featured, currency, listing_images(count), ${
        isStay ? "area, price_per_night" : "category, price_per_day"
      }`
    )
    .order("sort_order")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];
  const base = isStay ? "/admin/stays" : "/admin/rides";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">{isStay ? "stays" : "rides"}</h1>
          <p className="mt-2 text-sm text-muted">
            {isStay ? "Your apartments." : "Your cars."} Drafts are only visible to you.
          </p>
        </div>
        <Link href={`${base}/new`} className="bg-accent px-6 py-3 text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90">
          {isStay ? "Add a stay" : "Add a car"}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">Nothing here yet. Add your first {isStay ? "stay" : "car"} to get started.</p>
      ) : (
        <div className="overflow-x-auto border-y border-line">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-3 pr-4 font-normal">Name</th>
                <th className="py-3 pr-4 font-normal">{isStay ? "Area" : "Type"}</th>
                <th className="py-3 pr-4 font-normal">Price</th>
                <th className="py-3 pr-4 font-normal">Photos</th>
                <th className="py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 pr-4">
                    <Link href={`${base}/${r.id}`} className="underline decoration-line underline-offset-4 hover:decoration-accent">
                      {r.title}
                    </Link>
                    {r.featured && <span className="ml-2 text-xs text-muted">on home page</span>}
                  </td>
                  <td className="py-3 pr-4 text-muted">{(isStay ? r.area : r.category) ?? "-"}</td>
                  <td className="whitespace-nowrap py-3 pr-4">
                    {money((isStay ? r.price_per_night : r.price_per_day) ?? 0, r.currency)}
                    <span className="text-xs text-muted"> {isStay ? "/ night" : "/ day"}</span>
                  </td>
                  <td className="py-3 pr-4">{r.listing_images?.[0]?.count ?? 0}</td>
                  <td className="py-3">
                    <span className={`inline-block px-2.5 py-0.5 text-xs capitalize tracking-wider ${badge[r.status] ?? ""}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
