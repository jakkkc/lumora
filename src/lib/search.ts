import { supabasePublic } from "./supabase/public";

export type SearchType = "stay" | "ride" | "tour";
export type RawParams = Record<string, string | undefined>;

export type Img = { path: string; alt: string | null; sort_order: number; is_cover: boolean };
export type LocRef = { name: string; slug: string } | null;

export type StayItem = {
  kind: "stay";
  id: string;
  slug: string;
  title: string;
  area: string | null;
  location: LocRef;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  price: number;
  currency: string;
  min_nights: number;
  images: Img[];
};

export type RideItem = {
  kind: "ride";
  id: string;
  slug: string;
  title: string;
  make: string | null;
  model: string | null;
  category: string | null;
  seats: number;
  or_similar: boolean;
  min_days: number;
  self_price: number | null;
  chauffeur_price: number | null;
  currency: string;
  location: LocRef;
  images: Img[];
};

export type TourItem = {
  kind: "tour";
  id: string;
  slug: string;
  title: string;
  tour_type: "fixed" | "guide";
  price: number;
  price_basis: "per_person" | "per_group" | "per_day";
  duration_text: string | null;
  min_people: number;
  max_group: number;
  currency: string;
  location: LocRef;
  images: Img[];
};

export type Item = StayItem | RideItem | TourItem;

export type Query = {
  location: string;
  from: string;
  to: string;
  hasDates: boolean;
  max: number | null;
  cats: string[];
  seats: number;
  beds: number;
  guests: number;
  ttype: "" | "fixed" | "guide";
};

export type Result = { items: Item[]; categories: string[]; priceMin: number; priceMax: number };

const IMG = "listing_images(path, alt, sort_order, is_cover)";

const isDate = (s?: string): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string) {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

function todayNairobi() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
}

export function parseQuery(type: SearchType, raw: RawParams): Query {
  const today = todayNairobi();
  const from = isDate(raw.from) && raw.from >= today ? raw.from : "";
  let to = isDate(raw.to) ? raw.to : "";
  if (type === "tour" && from && !to) to = from;
  if (!from) to = "";
  if (from && to && (type === "stay" ? to <= from : to < from)) to = "";

  const num = (s?: string) => {
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  return {
    location: (raw.location ?? "").replace(/[^a-z0-9-]/g, "").slice(0, 60),
    from,
    to,
    hasDates: !!(from && to),
    max: num(raw.max) || null,
    cats: (raw.cat ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20),
    seats: num(raw.seats),
    beds: num(raw.beds),
    guests: num(raw.guests),
    ttype: raw.ttype === "fixed" || raw.ttype === "guide" ? raw.ttype : "",
  };
}

/** Nights for a stay, days for a car or tour. */
export function tripLength(type: SearchType, q: Query): number | null {
  if (!q.hasDates) return null;
  const n = diffDays(q.from, q.to);
  return type === "stay" ? n : n + 1;
}

function eachDay(start: string, endExclusive: string) {
  const out: string[] = [];
  let d = start;
  while (d < endExclusive && out.length < 400) {
    out.push(d);
    d = addDays(d, 1);
  }
  return out;
}

type Block = Record<string, string | null>;

// An item is free when, on every day asked for, fewer bookings than its capacity are confirmed.
async function freeIds(
  col: "property_id" | "vehicle_id" | "tour_id",
  caps: Map<string, number>,
  start: string,
  endExclusive: string
): Promise<Set<string>> {
  const ids = [...caps.keys()];
  const free = new Set<string>();
  if (ids.length === 0) return free;

  const { data, error } = await supabasePublic()
    .from("availability_blocks")
    .select(`${col}, starts_on, ends_on`)
    .in(col, ids)
    .lt("starts_on", endExclusive)
    .gt("ends_on", start);
  if (error) console.error("availability:", error.message);

  const blocks = (data ?? []) as unknown as Block[];
  const days = eachDay(start, endExclusive);

  for (const id of ids) {
    const mine = blocks.filter((b) => b[col] === id);
    const cap = caps.get(id) ?? 1;
    const busy = days.some(
      (d) => mine.filter((b) => d >= (b.starts_on as string) && d < (b.ends_on as string)).length >= cap
    );
    if (!busy) free.add(id);
  }
  return free;
}

async function fetchRows<T>(table: string, cols: string, location: string): Promise<T[]> {
  let query = supabasePublic()
    .from(table)
    .select(`${cols}, ${IMG}, location:locations${location ? "!inner" : ""}(name, slug)`)
    .eq("status", "published");
  if (location) query = query.eq("location.slug", location);
  const { data, error } = await query.order("sort_order").order("created_at", { ascending: false });
  if (error) console.error(`search ${table}:`, error.message);
  return (data ?? []) as unknown as T[];
}

function range(prices: number[]) {
  if (prices.length === 0) return { priceMin: 0, priceMax: 0 };
  return {
    priceMin: Math.floor(Math.min(...prices) / 100) * 100,
    priceMax: Math.ceil(Math.max(...prices) / 100) * 100,
  };
}

type StayRow = {
  id: string; slug: string; title: string; area: string | null; bedrooms: number; bathrooms: number;
  max_guests: number; price_per_night: number; currency: string; min_nights: number;
  location: LocRef; listing_images: Img[];
};

type RideRow = {
  id: string; slug: string; title: string; make: string | null; model: string | null; category: string | null;
  seats: number; or_similar: boolean; min_days: number; units: number;
  price_per_day: number | null; chauffeur_price_per_day: number | null; currency: string;
  location: LocRef; listing_images: Img[];
};

type TourRow = {
  id: string; slug: string; title: string; tour_type: "fixed" | "guide"; price: number;
  price_basis: "per_person" | "per_group" | "per_day"; duration_text: string | null;
  min_people: number; max_group: number; capacity_per_day: number; currency: string;
  location: LocRef; listing_images: Img[];
};

async function searchStays(q: Query): Promise<Result> {
  const rows = await fetchRows<StayRow>(
    "properties",
    "id, slug, title, area, bedrooms, bathrooms, max_guests, price_per_night, currency, min_nights",
    q.location
  );
  const { priceMin, priceMax } = range(rows.map((r) => Number(r.price_per_night)));

  let list = rows.filter(
    (r) =>
      (!q.max || r.price_per_night <= q.max) &&
      (!q.beds || r.bedrooms >= q.beds) &&
      (!q.guests || r.max_guests >= q.guests)
  );
  if (q.hasDates) {
    const free = await freeIds("property_id", new Map(list.map((r) => [r.id, 1])), q.from, q.to);
    list = list.filter((r) => free.has(r.id));
  }

  const items: StayItem[] = list.map((r) => ({
    kind: "stay",
    id: r.id,
    slug: r.slug,
    title: r.title,
    area: r.area,
    location: r.location,
    bedrooms: r.bedrooms,
    bathrooms: Number(r.bathrooms),
    max_guests: r.max_guests,
    price: Number(r.price_per_night),
    currency: r.currency,
    min_nights: r.min_nights,
    images: r.listing_images ?? [],
  }));
  return { items, categories: [], priceMin, priceMax };
}

const lowest = (r: RideRow) =>
  Math.min(...[r.price_per_day, r.chauffeur_price_per_day].filter((p): p is number => p !== null));

async function searchRides(q: Query): Promise<Result> {
  const rows = await fetchRows<RideRow>(
    "vehicles",
    "id, slug, title, make, model, category, seats, or_similar, min_days, units, price_per_day, chauffeur_price_per_day, currency",
    q.location
  );
  const { priceMin, priceMax } = range(rows.map((r) => lowest(r)));
  const categories = [...new Set(rows.map((r) => r.category).filter((c): c is string => !!c))].sort();

  let list = rows.filter(
    (r) =>
      (!q.max || lowest(r) <= q.max) &&
      (!q.seats || r.seats >= q.seats) &&
      (q.cats.length === 0 || (r.category !== null && q.cats.includes(r.category)))
  );
  if (q.hasDates) {
    const free = await freeIds(
      "vehicle_id",
      new Map(list.map((r) => [r.id, r.units ?? 1])),
      q.from,
      addDays(q.to, 1)
    );
    list = list.filter((r) => free.has(r.id));
  }

  const items: RideItem[] = list.map((r) => ({
    kind: "ride",
    id: r.id,
    slug: r.slug,
    title: r.title,
    make: r.make,
    model: r.model,
    category: r.category,
    seats: r.seats,
    or_similar: r.or_similar,
    min_days: r.min_days,
    self_price: r.price_per_day !== null ? Number(r.price_per_day) : null,
    chauffeur_price: r.chauffeur_price_per_day !== null ? Number(r.chauffeur_price_per_day) : null,
    currency: r.currency,
    location: r.location,
    images: r.listing_images ?? [],
  }));
  return { items, categories, priceMin, priceMax };
}

async function searchTours(q: Query): Promise<Result> {
  const rows = await fetchRows<TourRow>(
    "tours",
    "id, slug, title, tour_type, price, price_basis, duration_text, min_people, max_group, capacity_per_day, currency",
    q.location
  );
  const { priceMin, priceMax } = range(rows.map((r) => Number(r.price)));

  let list = rows.filter((r) => (!q.max || r.price <= q.max) && (!q.ttype || r.tour_type === q.ttype));
  if (q.hasDates) {
    const free = await freeIds(
      "tour_id",
      new Map(list.map((r) => [r.id, r.capacity_per_day ?? 1])),
      q.from,
      addDays(q.to, 1)
    );
    list = list.filter((r) => free.has(r.id));
  }

  const items: TourItem[] = list.map((r) => ({
    kind: "tour",
    id: r.id,
    slug: r.slug,
    title: r.title,
    tour_type: r.tour_type,
    price: Number(r.price),
    price_basis: r.price_basis,
    duration_text: r.duration_text,
    min_people: r.min_people,
    max_group: r.max_group,
    currency: r.currency,
    location: r.location,
    images: r.listing_images ?? [],
  }));
  return { items, categories: [], priceMin, priceMax };
}

export async function runSearch(type: SearchType, raw: RawParams): Promise<{ q: Query; result: Result }> {
  const q = parseQuery(type, raw);
  const result = type === "stay" ? await searchStays(q) : type === "ride" ? await searchRides(q) : await searchTours(q);
  return { q, result };
}
