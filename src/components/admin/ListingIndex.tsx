import Link from "next/link";
import { money } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";

type Kind = "stay" | "ride" | "tour";

type Row = {
  id: string;
  title: string;
  status: string;
  featured: boolean;
  currency: string;
  location: { name: string } | null;
  listing_images: { count: number }[];
  price_per_night?: number;
  price_per_day?: number | null;
  chauffeur_price_per_day?: number | null;
  price?: number;
  price_basis?: string;
};

const CFG: Record<Kind, { table: string; base: string; heading: string; intro: string; add: string; cols: string; empty: string }> = {
  stay: { table: "properties", base: "/admin/stays", heading: "stays", intro: "Your apartments.", add: "Add a stay", cols: "price_per_night", empty: "stay" },
  ride: { table: "vehicles", base: "/admin/rides", heading: "rides", intro: "Your cars.", add: "Add a car", cols: "price_per_day, chauffeur_price_per_day", empty: "car" },
  tour: { table: "tours", base: "/admin/tours", heading: "tours", intro: "Your tours and guides.", add: "Add a tour", cols: "price, price_basis", empty: "tour" },
};

const badge: Record<string, string> = {
  published: "bg-accent text-on-accent",
  draft: "border border-accent text-fg",
  archived: "border border-line text-muted",
};

const basisLabel: Record<string, string> = { per_person: "per person", per_group: "per group", per_day: "per day" };

function priceText(kind: Kind, r: Row) {
  if (kind === "stay") return `${money(r.price_per_night ?? 0, r.currency)} per night`;
  if (kind === "ride") {
    if (r.price_per_day != null) return `${money(r.price_per_day, r.currency)} per day`;
    return `${money(r.chauffeur_price_per_day ?? 0, r.currency)} per day, chauffeured`;
  }
  return `${money(r.price ?? 0, r.currency)} ${basisLabel[r.price_basis ?? "per_person"]}`;
}

export default async function ListingIndex({ kind }: { kind: Kind }) {
  const supabase = await supabaseServer();
  const c = CFG[kind];
  const { data } = await supabase
    .from(c.table)
    .select(`id, title, status, featured, currency, location:locations(name), listing_images(count), ${c.cols}`)
    .order("sort_order")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">{c.heading}</h1>
          <p className="mt-2 text-sm text-muted">{c.intro} Drafts are only visible to you.</p>
        </div>
        <Link href={`${c.base}/new`} className="bg-accent px-6 py-3 text-sm tracking-widest text-on-accent transition-opacity hover:opacity-90">
          {c.add}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">Nothing here yet. Add your first {c.empty} to get started.</p>
      ) : (
        <div className="overflow-x-auto border-y border-line">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-3 pr-4 font-normal">Name</th>
                <th className="py-3 pr-4 font-normal">Location</th>
                <th className="py-3 pr-4 font-normal">Price</th>
                <th className="py-3 pr-4 font-normal">Photos</th>
                <th className="py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 pr-4">
                    <Link href={`${c.base}/${r.id}`} className="underline decoration-line underline-offset-4 hover:decoration-accent">
                      {r.title}
                    </Link>
                    {r.featured && <span className="ml-2 text-xs text-muted">on home page</span>}
                  </td>
                  <td className="py-3 pr-4 text-muted">{r.location?.name ?? "Not set"}</td>
                  <td className="whitespace-nowrap py-3 pr-4">{priceText(kind, r)}</td>
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
