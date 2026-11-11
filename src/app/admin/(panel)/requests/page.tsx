import type { Metadata } from "next";
import Link from "next/link";
import RequestFilterBar from "@/components/admin/RequestFilterBar";
import RequestList, { type RequestRow } from "@/components/admin/RequestList";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Requests" };

const STATUSES: [string, string][] = [
  ["all", "All"],
  ["new", "New"],
  ["contacted", "Contacted"],
  ["confirmed", "Confirmed"],
  ["completed", "Completed"],
  ["declined", "Declined"],
  ["cancelled", "Cancelled"],
];

const HINT: Record<string, string> = {
  all: "Everything guests have sent, newest first.",
  new: "Nobody has replied yet.",
  contacted: "You have been in touch. Waiting to hear from the guest.",
  confirmed: "Booked. The dates are blocked on the website.",
  completed: "Finished. This counts as a sale.",
  declined: "You said no. The dates stay free.",
  cancelled: "Cancelled after confirming. The dates are free again.",
};

const KINDS = ["all", "stay", "ride", "tour"];

function href(status: string, kind: string, q: string) {
  const p = new URLSearchParams();
  if (status !== "all") p.set("status", status);
  if (kind !== "all") p.set("kind", kind);
  if (q) p.set("q", q);
  const s = p.toString();
  return s ? `/admin/requests?${s}` : "/admin/requests";
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kind?: string; q?: string }>;
}) {
  const raw = await searchParams;
  const status = STATUSES.some(([k]) => k === raw.status) ? (raw.status as string) : "all";
  const kind = KINDS.includes(raw.kind ?? "") ? (raw.kind as string) : "all";
  const q = (raw.q ?? "").replace(/[,()%*\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 50);

  const supabase = await supabaseServer();

  let list = supabase
    .from("booking_requests")
    .select(
      "id, reference, kind, starts_on, ends_on, full_name, status, created_at, drive_type, property:properties(title), vehicle:vehicles(title), tour:tours(title)"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (status !== "all") list = list.eq("status", status);
  if (kind !== "all") list = list.eq("kind", kind);
  if (q) {
    list = list.or(
      `reference.ilike.%${q}%,full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }

  let tally = supabase.from("booking_requests").select("status").limit(5000);
  if (kind !== "all") tally = tally.eq("kind", kind);

  const [listRes, tallyRes] = await Promise.all([list, tally]);
  const rows = (listRes.data ?? []) as unknown as RequestRow[];

  const counts: Record<string, number> = { all: 0 };
  for (const r of (tallyRes.data ?? []) as { status: string }[]) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
    counts.all += 1;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">requests</h1>

      <div className="space-y-3">
        <nav
          aria-label="Filter by status"
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {STATUSES.map(([key, label]) => {
            const on = key === status;
            const n = counts[key] ?? 0;
            return (
              <Link
                key={key}
                href={href(key, kind, q)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors ${
                  on ? "border-accent bg-accent text-on-accent" : "border-line hover:border-accent"
                }`}
              >
                {label}
                <span className={`text-xs ${on ? "opacity-80" : "text-muted"}`}>{n}</span>
                {key === "new" && n > 0 && !on && <span className="h-2 w-2 rounded-full bg-gold" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>
        <p className="text-sm text-muted">{HINT[status]}</p>
      </div>

      <RequestFilterBar status={status} kind={kind} q={q} />

      {rows.length === 0 ? (
        <p className="text-sm text-muted">
          {q ? `No requests match "${q}" here.` : "No requests match these filters."}
        </p>
      ) : (
        <RequestList rows={rows} />
      )}
    </div>
  );
}
