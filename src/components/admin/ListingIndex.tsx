import Link from "next/link";
import { money } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";
import ListingList, { type ListingRow } from "./ListingList";

type Kind = "stay" | "ride" | "tour";

type Row = {
  id: string;
  title: string;
  status: string;
  featured: boolean;
  currency: string;
  location: { name: string } | null;
  listing_images: { path: string; sort_order: number; is_cover: boolean }[];
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

const basisLabel: Record<string, string> = { per_person: "per person", per_group: "per group", per_day: "per day" };

function priceText(kind: Kind, r: Row) {
  if (kind === "stay") return `${money(r.price_per_night ?? 0, r.currency)} per night`;
  if (kind === "ride") {
    if (r.price_per_day != null) return `${money(r.price_per_day, r.currency)} per day`;
    return `${money(r.chauffeur_price_per_day ?? 0, r.currency)} per day, chauffeured`;
  }
  return `${money(r.price ?? 0, r.currency)} ${basisLabel[r.price_basis ?? "per_person"]}`;
}

function coverOf(images: Row["listing_images"]) {
  const sorted = [...(images ?? [])].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
  return sorted[0]?.path ?? null;
}

export default async function ListingIndex({ kind }: { kind: Kind }) {
  const supabase = await supabaseServer();
  const c = CFG[kind];
  const { data } = await supabase
    .from(c.table)
    .select(`id, title, status, featured, currency, location:locations(name), listing_images(path, sort_order, is_cover), ${c.cols}`)
    .order("sort_order")
    .order("created_at", { ascending: false });
  const raw = (data ?? []) as unknown as Row[];

  const rows: ListingRow[] = raw.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    featured: r.featured,
    location: r.location?.name ?? "No location",
    price: priceText(kind, r),
    photos: r.listing_images?.length ?? 0,
    cover: coverOf(r.listing_images),
  }));

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
        <ListingList rows={rows} base={c.base} />
      )}
    </div>
  );
}
