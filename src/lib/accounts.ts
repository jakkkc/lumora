import { addDays } from "./dates";
import { supabaseServer } from "./supabase/server";

const TZ = "Africa/Nairobi";

export type Kind = "stay" | "ride" | "tour";

export const PRESETS: { key: string; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "last-month", label: "Last month" },
  { key: "30", label: "Last 30 days" },
  { key: "year", label: "This year" },
];

export type Range = { from: string; to: string; preset: string };

export function todayNairobi() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

const isDate = (s?: string): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

export function resolveRange(raw: { range?: string; from?: string; to?: string }): Range {
  const today = todayNairobi();
  if (isDate(raw.from) && isDate(raw.to) && raw.from <= raw.to) {
    return { from: raw.from, to: raw.to, preset: "custom" };
  }
  const key = PRESETS.some((p) => p.key === raw.range) ? (raw.range as string) : "month";
  const monthStart = `${today.slice(0, 7)}-01`;
  switch (key) {
    case "today":
      return { from: today, to: today, preset: key };
    case "week": {
      const dow = new Date(today + "T00:00:00Z").getUTCDay();
      return { from: addDays(today, -((dow + 6) % 7)), to: today, preset: key };
    }
    case "last-month": {
      const end = addDays(monthStart, -1);
      return { from: `${end.slice(0, 7)}-01`, to: end, preset: key };
    }
    case "30":
      return { from: addDays(today, -29), to: today, preset: key };
    case "year":
      return { from: `${today.slice(0, 4)}-01-01`, to: today, preset: key };
    default:
      return { from: monthStart, to: today, preset: "month" };
  }
}

/** The address pieces that keep the chosen dates when you switch tabs. */
export function rangeQuery(r: Range) {
  return r.preset === "custom" ? `from=${r.from}&to=${r.to}` : `range=${r.preset}`;
}

export const nairobiDate = (ts: string) => new Date(ts).toLocaleDateString("en-CA", { timeZone: TZ });

export function dmy(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function rangeLabel(r: Range) {
  return r.from === r.to ? dmy(r.from) : `${dmy(r.from)} to ${dmy(r.to)}`;
}

type Pay = { kind: "payment" | "refund"; amount: number | string };
type Listing = { title: string; location: { name: string } | null } | null;
type Plain = { title: string } | null;

type RawSale = {
  id: string;
  reference: string;
  kind: Kind;
  full_name: string;
  completed_at: string;
  final_total: number | string | null;
  estimate_total: number | string | null;
  property: Listing;
  vehicle: Listing;
  tour: Listing;
  payments: Pay[] | null;
};

type RawTxn = {
  id: string;
  kind: "payment" | "refund";
  amount: number | string;
  method: string;
  reference: string | null;
  paid_on: string;
  note: string | null;
  request: {
    id: string;
    reference: string;
    full_name: string;
    kind: Kind;
    property: Plain;
    vehicle: Plain;
    tour: Plain;
  } | null;
};

type RawOpen = {
  final_total: number | string | null;
  estimate_total: number | string | null;
  payments: Pay[] | null;
};

export type Sale = {
  id: string;
  reference: string;
  kind: Kind;
  guest: string;
  title: string;
  location: string;
  completedOn: string;
  total: number;
  paid: number;
  balance: number;
  estimated: boolean;
};

export type Txn = {
  id: string;
  kind: "payment" | "refund";
  amount: number;
  method: string;
  reference: string | null;
  paidOn: string;
  note: string | null;
  requestId: string | null;
  requestRef: string;
  guest: string;
  reqKind: Kind | null;
  title: string;
};

export type Group = { name: string; count: number; total: number };

export type Accounts = {
  sales: Sale[];
  txns: Txn[];
  salesTotal: number;
  received: number;
  receivedCount: number;
  refunded: number;
  net: number;
  outstandingTotal: number;
  outstandingCount: number;
  estimatedCount: number;
  byService: Group[];
  byLocation: Group[];
};

const round = (n: number) => Math.round(n * 100) / 100;
const netOf = (p: Pay[] | null) =>
  (p ?? []).reduce((n, x) => n + (x.kind === "refund" ? -Number(x.amount) : Number(x.amount)), 0);

function group(items: Sale[], key: (s: Sale) => string): Group[] {
  const m = new Map<string, Group>();
  for (const s of items) {
    const k = key(s);
    const g = m.get(k) ?? { name: k, count: 0, total: 0 };
    g.count += 1;
    g.total = round(g.total + s.total);
    m.set(k, g);
  }
  return [...m.values()].sort((a, b) => b.total - a.total);
}

export async function loadAccounts(r: Range): Promise<Accounts> {
  const sb = await supabaseServer();
  // Nairobi is UTC+3 all year, so 00:00 there is 21:00 UTC the day before.
  const start = `${addDays(r.from, -1)}T21:00:00Z`;
  const end = `${r.to}T21:00:00Z`;
  const L = "title, location:locations(name)";

  const [salesRes, txnRes, openRes] = await Promise.all([
    sb
      .from("booking_requests")
      .select(
        `id, reference, kind, full_name, completed_at, final_total, estimate_total, property:properties(${L}), vehicle:vehicles(${L}), tour:tours(${L}), payments(kind, amount)`
      )
      .eq("status", "completed")
      .gte("completed_at", start)
      .lt("completed_at", end)
      .order("completed_at", { ascending: false })
      .limit(1000),
    sb
      .from("payments")
      .select(
        "id, kind, amount, method, reference, paid_on, note, request:booking_requests(id, reference, full_name, kind, property:properties(title), vehicle:vehicles(title), tour:tours(title))"
      )
      .gte("paid_on", r.from)
      .lte("paid_on", r.to)
      .order("paid_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1000),
    sb
      .from("booking_requests")
      .select("final_total, estimate_total, payments(kind, amount)")
      .in("status", ["confirmed", "completed"])
      .limit(2000),
  ]);

  const sales: Sale[] = ((salesRes.data ?? []) as unknown as RawSale[]).map((s) => {
    const l = s.property ?? s.vehicle ?? s.tour;
    const total = Number(s.final_total ?? s.estimate_total ?? 0);
    const paid = round(netOf(s.payments));
    return {
      id: s.id,
      reference: s.reference,
      kind: s.kind,
      guest: s.full_name,
      title: l?.title ?? "Removed listing",
      location: l?.location?.name ?? "No location",
      completedOn: nairobiDate(s.completed_at),
      total,
      paid,
      balance: round(total - paid),
      estimated: s.final_total == null,
    };
  });

  const txns: Txn[] = ((txnRes.data ?? []) as unknown as RawTxn[]).map((t) => {
    const q = t.request;
    return {
      id: t.id,
      kind: t.kind,
      amount: Number(t.amount),
      method: t.method,
      reference: t.reference,
      paidOn: t.paid_on,
      note: t.note,
      requestId: q?.id ?? null,
      requestRef: q?.reference ?? "Removed request",
      guest: q?.full_name ?? "",
      reqKind: q?.kind ?? null,
      title: q?.property?.title ?? q?.vehicle?.title ?? q?.tour?.title ?? "",
    };
  });

  const received = round(txns.filter((t) => t.kind === "payment").reduce((n, t) => n + t.amount, 0));
  const refunded = round(txns.filter((t) => t.kind === "refund").reduce((n, t) => n + t.amount, 0));

  let outstandingTotal = 0;
  let outstandingCount = 0;
  for (const o of (openRes.data ?? []) as unknown as RawOpen[]) {
    const due = Number(o.final_total ?? o.estimate_total ?? 0) - netOf(o.payments);
    if (due > 0.5) {
      outstandingTotal += due;
      outstandingCount += 1;
    }
  }

  const names: Record<Kind, string> = { stay: "Stays", ride: "Rides", tour: "Tours" };
  const byService = (["stay", "ride", "tour"] as Kind[]).map((k) => {
    const mine = sales.filter((s) => s.kind === k);
    return { name: names[k], count: mine.length, total: round(mine.reduce((n, s) => n + s.total, 0)) };
  });

  return {
    sales,
    txns,
    salesTotal: round(sales.reduce((n, s) => n + s.total, 0)),
    received,
    receivedCount: txns.filter((t) => t.kind === "payment").length,
    refunded,
    net: round(received - refunded),
    outstandingTotal: round(outstandingTotal),
    outstandingCount,
    estimatedCount: sales.filter((s) => s.estimated).length,
    byService,
    byLocation: group(sales, (s) => s.location),
  };
}
